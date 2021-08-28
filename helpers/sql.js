const { BadRequestError } = require("../expressError");

// THIS NEEDS SOME GREAT DOCUMENTATION.

/**Convert JavaScript to SQL
 * Accepts:
 * datatoUpdate = { key value pairs of data wanting to be updated / inserted}, 
 * jsToSql = { key value pairs defining the name of the SQL columns we are inserting into}
 * 
 * Returns:
 * {
 * setCols = ""first_name"=$1'4'"age"=$2'"
 * values = [ Array containg the values associated with the above proxies ]
 * }
 */

function sqlForPartialUpdate(dataToUpdate, jsToSql) {
  const keys = Object.keys(dataToUpdate);
  if (keys.length === 0) throw new BadRequestError("No data");

  // {firstName: 'Aliya', age: 32} => ['"first_name"=$1', '"age"=$2']
  const cols = keys.map((colName, idx) =>
      `"${jsToSql[colName] || colName}"=$${idx + 1}`,
  );

  return {
    setCols: cols.join(", "),
    values: Object.values(dataToUpdate),
  };
}

module.exports = { sqlForPartialUpdate };
