const dotenv = require('dotenv');
const axios = require('axios');

dotenv.config();
const update = async (type, data) => {
    // /schedule
    await axios.post(`${process.env.BASEURL}/${type}`, data);
}

module.exports = update;