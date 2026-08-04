const success = (data = null, message = 'Success', status = 200) => {
  
  return {
    success: true,
    status,
    message,
    data
  };
};

const error = (message = 'Error', status = 400, errors = null) => {
  return {
    success: false,
    status,
    message,
    errors
  };
};

module.exports = {
  success,
  error
};