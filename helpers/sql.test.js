const { sqlForPartialUpdate } = require('./sql');
const { BadRequestError } = require("../expressError");


describe('sqlForPartialUpdate', function() {
    test('works', function() {
        const data = { numEmployees: 5 }
        const js = {
            numEmployees: "num_employees",
            logoUrl: "logo_url"
          };
        const sql = sqlForPartialUpdate(data, js)
        expect(sql.setCols).toEqual(`"num_employees"=$1`)
        expect(sql.values).toEqual([5])
    })

    test('throws error', function() {
        const data = {}
        const js = {}
        expect(() => sqlForPartialUpdate(data,js)).toThrowError(BadRequestError)
    })
})