
async function performCrudOperation(model, operation, data) {
  
    switch (operation) {
      case 'create':
        return model.create(data);
      case 'update':
        return model.findByIdAndUpdate(data.id, data.updates, { new: true });
      case 'delete':
        return model.findByIdAndDelete(data.id);
      case 'getOne':
        return model.findById(data.id);
      case 'getAll':
        return model.find();
      default:
        throw new Error('Invalid operation');
    }
  }
  
  module.exports = {
    performCrudOperation,
  };
  