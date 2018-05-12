const cassandra = require('cassandra-driver');
const client = new cassandra.Client({ contactPoints: ['35.229.42.28:9042'], keyspace: 'canteen' });

const responseToCashboxQueue = function (response) {
    let cashboxes = new Map();
    response.rows.forEach((row) => {
        let cashbox = cashboxes[row.cashbox_id];
        if (!cashbox) {
            cashbox = [];
            cashboxes[row.cashbox_id] = cashbox;
        }
        cashbox.push(row.enqueued_at);
    });
    const cashboxArr = [];
    for (var key in cashboxes) {
        cashboxArr.push({
            cashbox_id: key,
            enqueued_at: cashboxes[key]
        })
    }
    return cashboxArr
};

export default {
    client,
    responseToCashboxQueue
}