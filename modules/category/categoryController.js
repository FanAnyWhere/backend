const CategoryModel = require('./categoryModel');
const Utils = require('../../helper/utils');
const { query } = require('winston');
const CategoryCtr = {};

// add new category
CategoryCtr.addNewCategory = async (req, res) => {
  try {
    const { name, image } = req.body;

    const createNewCategory = new CategoryModel({
      categoryName: name,
      slugText: name.en,
      image: image ? image : null,
    });

    await createNewCategory.save();

    return res.status(200).json({
      message: req.t('CATEGORY_ADDED'),
      status: true,
    });
  } catch (err) {
    Utils.echoLog('error in creating user ', err);
    return res.status(500).json({
      message: req.t('DB_ERROR'),
      status: true,
      err: err.message ? err.message : err,
    });
  }
};

// get category
CategoryCtr.getCategoryDetails = async (req, res) => {
  try {
    const query = {};
    if (req.query.categoryId && req.role === 'ADMIN') {
      query._id = req.query.categoryId;
    } else {
      if (req.categoryData && req.categoryData._id && req.role !== 'ADMIN') {
        query._id = req.categoryData._id;
      }
    }

    if (Object.keys(query).length) {
      const fetchCategoryData = await CategoryModel.findOne(query);

      return res.status(200).json({
        message: req.t('SUCCESS'),
        status: true,
        data: fetchCategoryData,
      });
    } else {
      return res.status(400).json({
        message: req.t('INVALID_DETAILS'),
        status: false,
      });
    }
  } catch (err) {
    Utils.echoLog('error in getting category ', err);
    return res.status(500).json({
      message: req.t('DB_ERROR'),
      status: true,
      err: err.message ? err.message : err,
    });
  }
};

// update category
CategoryCtr.updateCategory = async (req, res) => {
  try {
    const getCategoryDetails = await CategoryModel.findById(req.params.id);

    if (getCategoryDetails) {
      if (req.body.categoryName) {
        getCategoryDetails.categoryName = req.body.categoryName;
        getCategoryDetails.slugText = req.body.categoryName.en;
      }

      if (req.body.status === false) {
        getCategoryDetails.isActive = false;
      }
      if (req.body.status) {
        getCategoryDetails.isActive = true;
      }

      if (req.body.image) {
        getCategoryDetails.image = req.body.image;
      }
      const saveDetails = await getCategoryDetails.save();

      return res.status(200).json({
        message: req.t('CATEGORY_UPDATED'),
        status: true,
        data: {
          _id: saveDetails._id,
          categoryName: saveDetails.categoryName,
          isActive: saveDetails.isActive,
        },
      });
    } else {
      return res.status(400).json({
        message: req.t('INVALID_CATEGORY'),
        status: true,
      });
    }
  } catch (err) {
    Utils.echoLog('error in creating user ', err);
    return res.status(500).json({
      message: req.t('DB_ERROR'),
      status: true,
      err: err.message ? err.message : err,
    });
  }
};

// list category
CategoryCtr.list = async (req, res) => {
  try {
    let query = { isActive: true };
    if (req.query.list === 'all') {
      query = {};
    }

    if (req.role !== 'ADMIN') {
      const list = await CategoryModel.find(query);
      return res.status(200).json({
        message: req.t('CATEGORY_LIST'),
        status: true,
        data: list,
      });
    } else {
      const page = req.query.page || 1;
      const totalCount = await CategoryModel.countDocuments(query);
      const pageCount = Math.ceil(totalCount / +process.env.LIMIT);

      const list = await CategoryModel.find(query)
        .skip((+page - 1 || 0) * +process.env.LIMIT)
        .limit(+process.env.LIMIT);

      return res.status(200).json({
        message: req.t('SUCCESS'),
        status: true,
        data: list,
        pagination: {
          pageNo: page,
          totalRecords: totalCount,
          totalPages: pageCount,
          limit: +process.env.LIMIT,
        },
      });
    }
  } catch (err) {
    // console.log('- ', err)
    Utils.echoLog('error in listing  user ', err);
    return res.status(500).json({
      message: req.t('DB_ERROR'),
      status: true,
      err: err.message ? err.message : err,
    });
  }
};

module.exports = CategoryCtr;
