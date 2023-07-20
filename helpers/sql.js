const { BadRequestError } = require("../expressError");

/* THIS NEEDS SOME GREAT DOCUMENTATION. */

/* function that generates an SQL query string and corresponding values for a partial update from given input data */

function sqlForPartialUpdate(dataToUpdate, jsToSql) {

  /* retrieve all keys (column names) from the data object */
  const keys = Object.keys(dataToUpdate);

  /* create an error if no key data (columns to update) was passed in */
  if (keys.length === 0) throw new BadRequestError("No data");

  /* map each column name to the corresponding query string in the proper format */
  /* {firstName: 'Aliya', age: 32} => ['"first_name"=$1', '"age"=$2'] */
  const cols = keys.map((colName, idx) =>
      `"${jsToSql[colName] || colName}"=$${idx + 1}`,
  );

  /* return an object with two properties: the proper set clause for the query and the paramaterized values */
  return {
    setCols: cols.join(", "),
    values: Object.values(dataToUpdate),
  };
}

module.exports = { sqlForPartialUpdate };
