function successResponse(data, message = 'Success',statusCode = 200,
) {
    return {
      success: true,
      message,
      data,
      statusCode,
    };
  }
  
  function errorResponse(message = 'Error', statusCode = 500) {
    return {
      success: false,
      message,
      statusCode,
    };
  }
  
  module.exports = {
    successResponse,
    errorResponse,
  };
  