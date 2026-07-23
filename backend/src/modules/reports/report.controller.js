const { getSalesReport, getMenuReport, getStaffReport, getReportsSummary, getRevenueTrend, getOrdersTrend, getTopItems } = require('./report.service');
const { sendSuccess } = require('../../utils/apiResponse');

async function sales(request, response, next) {
  try {
    const report = await getSalesReport(request.user.restaurantId);
    return sendSuccess(response, { statusCode: 200, message: 'Sales report fetched successfully.', data: report });
  } catch (error) {
    return next(error);
  }
}

async function menu(request, response, next) {
  try {
    const report = await getMenuReport(request.user.restaurantId);
    return sendSuccess(response, { statusCode: 200, message: 'Menu report fetched successfully.', data: report });
  } catch (error) {
    return next(error);
  }
}

async function staff(request, response, next) {
  try {
    const report = await getStaffReport(request.user.restaurantId);
    return sendSuccess(response, { statusCode: 200, message: 'Staff report fetched successfully.', data: report });
  } catch (error) {
    return next(error);
  }
}

async function summary(request, response, next) {
  try {
    const report = await getReportsSummary(request.user.restaurantId, request.query.period);
    return sendSuccess(response, { statusCode: 200, message: 'Summary report fetched successfully.', data: report });
  } catch (error) {
    return next(error);
  }
}

async function revenue(request, response, next) {
  try {
    const report = await getRevenueTrend(request.user.restaurantId, request.query.period);
    return sendSuccess(response, { statusCode: 200, message: 'Revenue trend fetched successfully.', data: report });
  } catch (error) {
    return next(error);
  }
}

async function orders(request, response, next) {
  try {
    const report = await getOrdersTrend(request.user.restaurantId, request.query.period);
    return sendSuccess(response, { statusCode: 200, message: 'Orders trend fetched successfully.', data: report });
  } catch (error) {
    return next(error);
  }
}

async function topItems(request, response, next) {
  try {
    const report = await getTopItems(request.user.restaurantId, request.query.period);
    return sendSuccess(response, { statusCode: 200, message: 'Top items fetched successfully.', data: report });
  } catch (error) {
    return next(error);
  }
}

module.exports = {
  sales,
  menu,
  staff,
  summary,
  revenue,
  orders,
  topItems
};

