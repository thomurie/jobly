const { sqlForPartialUpdate } = require("./sql")

describe("test sqlForPartialUpdate", function () {
  test("Is this working?", function () {
      const data = sqlForPartialUpdate(
          { name: 'toradora' },
          { numEmployees: 'num_employees', logoUrl: 'logo_url' }
      )
      expect(data).toEqual({ setCols: '"name"=$1', values: [ 'toradora' ] })
  });
    
    test("Invalid Request", function () {
      try {
        sqlForPartialUpdate(
            { },
            { numEmployees: 'num_employees', logoUrl: 'logo_url' }
        )
      } catch (error) {
          expect(error.status).toEqual(400)
      }
    });
});
