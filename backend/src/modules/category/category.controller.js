const {
  createCategory,
  getCategories,
  getCategoryById,
  updateCategory,
  deleteCategory,
  getCategoriesByRestaurantId
} = require('./category.service');
const { sendSuccess, sendError } = require('../../utils/apiResponse');

async function create(request, response, next) {
  try {
    const category = await createCategory(request.body);
    return sendSuccess(response, { statusCode: 201, message: 'Category created successfully.', data: { category } });
  } catch (error) {
    return next(error);
  }
}

async function list(request, response, next) {
  try {
    const categories = await getCategories();
    return sendSuccess(response, { statusCode: 200, message: 'Categories fetched successfully.', data: { categories } });
  } catch (error) {
    return next(error);
  }
}

async function getById(request, response, next) {
  try {
    const category = await getCategoryById(request.params.id);
    if (!category) {
      return sendError(response, { statusCode: 404, message: 'Category not found.' });
    }

    return sendSuccess(response, { statusCode: 200, message: 'Category fetched successfully.', data: { category } });
  } catch (error) {
    return next(error);
  }
}

async function update(request, response, next) {
  try {
    const category = await updateCategory(request.params.id, request.body);
    if (!category) {
      return sendError(response, { statusCode: 404, message: 'Category not found.' });
    }

    return sendSuccess(response, { statusCode: 200, message: 'Category updated successfully.', data: { category } });
  } catch (error) {
    return next(error);
  }
}

async function remove(request, response, next) {
  try {
    const deleted = await deleteCategory(request.params.id);
    if (!deleted) {
      return sendError(response, { statusCode: 404, message: 'Category not found.' });
    }

    return sendSuccess(response, { statusCode: 200, message: 'Category deleted successfully.', data: {} });
  } catch (error) {
    return next(error);
  }
}

async function listByRestaurant(request, response, next) {
  try {
    const categories = await getCategoriesByRestaurantId(request.params.restaurantId);
    return sendSuccess(response, { statusCode: 200, message: 'Restaurant categories fetched successfully.', data: { categories } });
  } catch (error) {
    return next(error);
  }
}

module.exports = {
  create,
  list,
  getById,
  update,
  remove,
  listByRestaurant
};
