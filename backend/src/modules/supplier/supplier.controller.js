const { getSuppliersByRestaurantId, createSupplier, updateSupplier, deleteSupplier } = require('./supplier.service');
const { sendSuccess, sendError } = require('../../utils/apiResponse');

async function getSuppliers(req, res, next) {
  try {
    const restaurantId = req.user.restaurantId;
    const suppliers = await getSuppliersByRestaurantId(restaurantId);
    return sendSuccess(res, {
      statusCode: 200,
      message: 'Suppliers fetched successfully',
      data: suppliers
    });
  } catch (error) {
    return next(error);
  }
}

async function addSupplier(req, res, next) {
  try {
    const restaurantId = req.user.restaurantId;
    const supplier = await createSupplier(restaurantId, req.body);
    return sendSuccess(res, {
      statusCode: 201,
      message: 'Supplier created successfully',
      data: supplier
    });
  } catch (error) {
    return next(error);
  }
}

async function editSupplier(req, res, next) {
  try {
    const restaurantId = req.user.restaurantId;
    const supplier = await updateSupplier(restaurantId, req.params.id, req.body);
    return sendSuccess(res, {
      statusCode: 200,
      message: 'Supplier updated successfully',
      data: supplier
    });
  } catch (error) {
    return next(error);
  }
}

async function removeSupplier(req, res, next) {
  try {
    const restaurantId = req.user.restaurantId;
    await deleteSupplier(restaurantId, req.params.id);
    return sendSuccess(res, {
      statusCode: 200,
      message: 'Supplier deleted successfully'
    });
  } catch (error) {
    return next(error);
  }
}

module.exports = {
  getSuppliers,
  addSupplier,
  editSupplier,
  removeSupplier
};
