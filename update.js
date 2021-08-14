const dotenv = require('dotenv');

dotenv.config();
const update = (type) => {  /// (type) -> (type, data)
    // TODO Request Update Data...
    console.log(`${process.env.BASEURL}/${type}`);
}

module.exports = update;