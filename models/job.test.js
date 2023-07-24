"use strict";

const db = require("../db.js");
const { BadRequestError, NotFoundError } = require("../expressError.js");
const Job = require("./job.js");
const {
  commonBeforeAll,
  commonBeforeEach,
  commonAfterEach,
  commonAfterAll,
} = require("./_testCommon.js");

beforeAll(commonBeforeAll);
beforeEach(commonBeforeEach);
afterEach(commonAfterEach);
afterAll(commonAfterAll);

/************************************** create */

describe("create", function () {
  const newJob = {
    title: "new",
    salary: 50000,
    equity: 0.25,
    companyHandle: "c1"
  };

  test("works", async function () {
    let job = await Job.create(newJob);
    console.log(job)
    expect(job).toEqual({
      id: expect.any(Number),
      title: "new",
      salary: 50000,
      equity: '0.25',
      companyHandle: "c1"
    });

    const result = await db.query(
          `SELECT id, title, salary, equity, company_handle AS "companyHandle"
           FROM jobs
           WHERE title = 'new'`);
    expect(result.rows).toEqual([
      { id: expect.any(Number),
        title: "new",
        salary: 50000,
        equity: '0.25',
        companyHandle: "c1"
      },
    ]);
  });

  test("bad request with dupe", async function () {
    try {
      await Job.create(newJob);
      await Job.create(newJob);
      fail();
    } catch (err) {
      expect(err instanceof BadRequestError).toBeTruthy();
    }
  });
});

/************************************** findAll */

describe("findAll", function () {
  test("works: no filter", async function () {
    let jobs = await Job.findAll();
    expect(jobs).toEqual([
      { 
        id: expect.any(Number),
        title: "testtitle1",
        salary: 10000,
        equity: '0.4',
        companyHandle: "c1"
      },
      {
        id: expect.any(Number),
        title: "testtitle2",
        salary: 12345,
        equity: '0.5',
        companyHandle: "c2"
      },
      {
        id: expect.any(Number),
        title: "testtitle3",
        salary: 15000,
        equity: '0.6',
        companyHandle: "c3"
      }
    ]);
  });
});

// /************************************** get */

describe("get", function () {
  test("works", async function () {
    const existingJob = await db.query(`SELECT id, title 
                                FROM jobs 
                                WHERE title = 'testtitle1'`)
    const job = await Job.get(`${parseInt(existingJob.rows[0].id)}`);
    expect(job).toEqual({
      id: expect.any(Number),
      title: "testtitle1",
      salary: 10000,
      equity: '0.4',
      companyHandle: "c1"
    });
  });

  test("not found if no such job", async function () {
    try {
      await Job.get(-1);
      fail();
    } catch (err) {
      expect(err instanceof NotFoundError).toBeTruthy();
    }
  });
});

// /************************************** update */

describe("update", function () {
  test("works", async function () {
    const updateData = {
      title: 'updated',
      salary: 88,
      equity: '0.9'
    };
    const existingJob = await db.query(`SELECT id, title 
                                        FROM jobs 
                                        WHERE title = 'testtitle1'`)
    const job = await Job.update(parseInt(existingJob.rows[0].id), updateData);
    expect(job).toEqual({
      id: parseInt(existingJob.rows[0].id),
      ...updateData,
      companyHandle: 'c1'
    });

    const result = await db.query(
          `SELECT id, title, salary, equity, company_handle AS "companyHandle"
           FROM jobs
           WHERE id = $1`, [parseInt(existingJob.rows[0].id)]);
    expect(result.rows).toEqual([{
      id: parseInt(existingJob.rows[0].id),
      ...updateData,
      companyHandle: 'c1'
    }]);
  });

  test("works: null fields", async function () {
    const existingJob = await db.query(`SELECT id, title 
                                        FROM jobs 
                                        WHERE title = 'testtitle1'`)
    const updateDataSetNulls = {
      title: "updatedWithNulls",
      salary: null,
      equity: null,
    };

    const job = await Job.update(parseInt(existingJob.rows[0].id), updateDataSetNulls);
    expect(job).toEqual({
      id: parseInt(existingJob.rows[0].id),
      ...updateDataSetNulls,
      companyHandle: "c1"
    });

    const result = await db.query(
          `SELECT id, title, salary, equity, company_handle AS "companyHandle"
           FROM jobs
           WHERE id = $1`, [parseInt(existingJob.rows[0].id)]);
    expect(result.rows).toEqual([{
      id: parseInt(existingJob.rows[0].id),
      ...updateDataSetNulls,
      companyHandle: "c1"
    }]);
  });

  test("not found if no such job", async function () {
    try {
      const updateData = {
        title: 'updated',
        salary: 88,
        equity: '0.9'
      };
      await Job.update(-1, updateData);
      fail();
    } catch (err) {
      expect(err instanceof NotFoundError).toBeTruthy();
    }
  });

  test("bad request with no data", async function () {
    try {
      const existingJob = await db.query(`SELECT id, title 
                                        FROM jobs 
                                        WHERE title = 'testtitle1'`)
      await Job.update(parseInt(existingJob.rows[0].id), {});
      fail();
    } catch (err) {
      expect(err instanceof BadRequestError).toBeTruthy();
    }
  });
});

// /************************************** remove */

describe("remove", function () {
  test("works", async function () {
    const existingJob = await db.query(`SELECT id, title 
                                        FROM jobs 
                                        WHERE title = 'testtitle1'`)
    await Job.remove(existingJob.rows[0].id);
    const res = await db.query(
        "SELECT id FROM jobs WHERE id = $1", [existingJob.rows[0].id]);
    expect(res.rows.length).toEqual(0);
  });

  test("not found if no such job", async function () {
    try {
      await Job.remove(-1);
      fail();
    } catch (err) {
      expect(err instanceof NotFoundError).toBeTruthy();
    }
  });
});
