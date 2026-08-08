const DEFAULT_PAGE = 1;
const DEFAULT_LIMIT = 10;
const MAX_LIMIT = 100;

function parseInteger(value, fallback) {
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function parseListOptions(query = {}, { sortMap, defaultSortKey = 'createdAt' } = {}) {
  const page = Math.max(parseInteger(query.page, DEFAULT_PAGE), 1);
  const limit = Math.min(Math.max(parseInteger(query.limit, DEFAULT_LIMIT), 1), MAX_LIMIT);
  const search = typeof query.search === 'string' ? query.search.trim() : '';
  const sortKey = typeof query.sort === 'string' && sortMap[query.sort] ? query.sort : defaultSortKey;
  const sortColumn = sortMap[sortKey];
  const order = String(query.order || 'DESC').toUpperCase() === 'ASC' ? 'ASC' : 'DESC';

  return {
    page,
    limit,
    offset: (page - 1) * limit,
    search,
    sortKey,
    sortColumn,
    order
  };
}

async function executePaginatedQuery({
  pool,
  selectClause,
  fromClause,
  whereClauses = [],
  params = [],
  sortColumn,
  order,
  page,
  limit,
  offset
}) {
  const whereSql = whereClauses.length ? ` WHERE ${whereClauses.join(' AND ')}` : '';
  const [countRows] = await pool.execute(
    `SELECT COUNT(*) AS total ${fromClause}${whereSql}`,
    params
  );
  const total = Number(countRows[0]?.total || 0);
  const totalPages = total === 0 ? 0 : Math.ceil(total / limit);
  const [rows] = await pool.execute(
    `${selectClause} ${fromClause}${whereSql} ORDER BY ${sortColumn} ${order} LIMIT ${Number(limit)} OFFSET ${Number(offset)}`,
    params
  );

  return {
    page,
    limit,
    total,
    totalPages,
    data: rows
  };
}

module.exports = {
  parseListOptions,
  executePaginatedQuery
};
