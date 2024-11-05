const express = require('express');
const router = express.Router();
const cache = require("./../components/db/cache")

router.get('/listcalls', async function(req, res, next) {
    let count = await cache.count("study")
    res.send({})
});

module.exports = router;