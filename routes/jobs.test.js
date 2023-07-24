"use strict";

const request = require("supertest");

const db = require("../db");
const app = require("../app");

const {
  commonBeforeAll,
  commonBeforeEach,
  commonAfterEach,
  commonAfterAll,
  u1Token,
  u2Token,
  testObjects
} = require("./_testCommon");

beforeAll(commonBeforeAll);
beforeEach(commonBeforeEach);
afterEach(commonAfterEach);
afterAll(commonAfterAll);

/************************************** POST /jobs */

describe("POST /jobs", function () {
  const newJob = {
    title: "test",
    salary: 50000,
    equity: 0.4,
    companyHandle: 'c1',
  };

  test("ok for users", async function () {
    const resp = await request(app)
        .post("/jobs")
        .send(newJob)
        .set("authorization", `Bearer ${u1Token}`);
    expect(resp.statusCode).toEqual(201);
    expect(resp.body).toEqual({
      job: {id : expect.any(Number),
            title: "test",
            salary: 50000,
            equity: '0.4',
            companyHandle: 'c1'}
    });
  });

  test("bad request with missing data", async function () {
    const resp = await request(app)
        .post("/jobs")
        .send({
          title: "newTestTitle",
        })
        .set("authorization", `Bearer ${u1Token}`);
    expect(resp.statusCode).toEqual(400);
  });

  test("bad request with invalid data", async function () {
    const resp = await request(app)
        .post("/jobs")
        .send({
            title: "invalidtest",
            salary: '50000',
            equity: 2,
            companyHandle: 5,
        })
        .set("authorization", `Bearer ${u1Token}`);
    expect(resp.statusCode).toEqual(400);
  });
});

/************************************** GET /jobs */

describe("GET /jobs", function () {
  test("ok for anon", async function () {
    const resp = await request(app).get("/jobs");
    console.log(testObjects)
    expect(resp.body).toEqual({
      jobs:
        [{ 
            id: expect.any(Number),
            title: "testtitle1",
            salary: 10000,
            equity: '0.4',
            companyHandle: "c1"
        },
        {
            id: expect.any(Number),
            title: "testtitle3",
            salary: 15000,
            equity: '0.6',
            companyHandle: "c3"
        },
        {
            id: expect.any(Number),
            title: "testtitle4",
            salary: 15000,
            equity: '0.6',
            companyHandle: "c1"
        }],
    });
  });

  test("works: filtering", async function() {
    // should return all jobs when the title of the job contains the filter and should be case insensitive
    const resp = await request(app).get(`/jobs/?title=testtitle1`);
    expect(resp.body).toEqual({
      jobs :
        [{ 
            id: expect.any(Number),
            title: "testtitle1",
            salary: 10000,
            equity: '0.4',
            companyHandle: "c1"
        }]
    })
  })

  test("fails: test next() handler", async function () {
    // there's no normal failure event which will cause this route to fail ---
    // thus making it hard to test that the error-handler works with it. This
    // should cause an error, all right :)
    await db.query("DROP TABLE jobs CASCADE");
    const resp = await request(app)
        .get("/jobs")
        .set("authorization", `Bearer ${u1Token}`);
    expect(resp.statusCode).toEqual(500);
  });
});


// /************************************** GET /jobs/:id */

describe("GET /jobs/:id", function () {
  test("works for anon", async function () {
    const resp = await request(app).get(`/jobs/${testObjects['t1']}`);
    expect(resp.body).toEqual({
      job: { 
        id: testObjects['t1'],
        title: "testtitle1",
        salary: 10000,
        equity: '0.4',
        companyHandle: "c1"
    },
    });
  });

//   test("works for anon: company w/o jobs", async function () {
//     const resp = await request(app).get(`/companies/c2`);
//     expect(resp.body).toEqual({
//       company: {
//         handle: "c2",
//         name: "C2",
//         description: "Desc2",
//         numEmployees: 2,
//         logoUrl: "http://c2.img",
//       },
//     });
//   });

  test("not found for no such job", async function () {
    const resp = await request(app).get(`/jobs/-1`);
    expect(resp.statusCode).toEqual(404);
  });
});

// /************************************** PATCH /jobs/:id */

describe("PATCH /jobs/:id", function () {
  test("works for admins", async function () {
    const resp = await request(app)
        .patch(`/jobs/${testObjects['t1']}`)
        .send({
          title: "updatedTitle",
        })
        .set("authorization", `Bearer ${u1Token}`);
    expect(resp.body).toEqual({
      job: {
        id: testObjects['t1'],
            title: "updatedTitle",
            salary: 10000,
            equity: '0.4',
            companyHandle: "c1"
      },
    });
  });

  test("unauth for non admins", async function () {
    const resp = await request(app)
        .patch(`/jobs/${testObjects['t1']}`)
        .send({
          title: "updatedTitle",
        })
        .set("authorization", `Bearer ${u2Token}`);
        expect(resp.statusCode).toEqual(401);
  });

  test("unauth for anon", async function () {
    const resp = await request(app)
        .patch(`/jobs/${testObjects['t1']}`)
        .send({
          title: "notAuth",
        });
    expect(resp.statusCode).toEqual(401);
  });

  test("not found on no such job", async function () {
    const resp = await request(app)
        .patch(`/jobs/-1`)
        .send({
          title: "noSuch",
        })
        .set("authorization", `Bearer ${u1Token}`);
    expect(resp.statusCode).toEqual(404);
  });

  test("bad request on id change attempt", async function () {
    const resp = await request(app)
        .patch(`/jobs/${testObjects['t1']}`)
        .send({
          id: 50,
        })
        .set("authorization", `Bearer ${u1Token}`);
    expect(resp.statusCode).toEqual(400);
  });

  test("bad request on invalid data", async function () {
    const resp = await request(app)
        .patch(`/jobs/${testObjects['t1']}`)
        .send({
          title: 55,
        })
        .set("authorization", `Bearer ${u1Token}`);
    expect(resp.statusCode).toEqual(400);
  });
});

// /************************************** DELETE /jobs/:id*/

describe("DELETE /jobs/:id", function () {
  test("works for admins", async function () {
    const resp = await request(app)
        .delete(`/jobs/${testObjects['t1']}`)
        .set("authorization", `Bearer ${u1Token}`);
    expect(resp.body).toEqual({ deleted: testObjects['t1'].toString() });
  });

  test("unauth for non admins", async function () {
    const resp = await request(app)
        .delete(`/jobs/${testObjects['t1']}`)
        .set("authorization", `Bearer ${u2Token}`);
        expect(resp.statusCode).toEqual(401);
    });

  test("unauth for anon", async function () {
    const resp = await request(app)
        .delete(`/jobs/${testObjects['t1']}`);
    expect(resp.statusCode).toEqual(401);
  });

  test("not found for no such job", async function () {
    const resp = await request(app)
        .delete(`/jobs/-1`)
        .set("authorization", `Bearer ${u1Token}`);
    expect(resp.statusCode).toEqual(404);
  });
});
