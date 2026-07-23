const express = require('express');
const { getSuppliers, addSupplier, editSupplier, removeSupplier } = require('./supplier.controller');

const router = express.Router();

router.get('/', getSuppliers);
router.post('/', addSupplier);
router.put('/:id', editSupplier);
router.delete('/:id', removeSupplier);

module.exports = router;
