import promisifyRedis from 'promisify-redis';

const redis = promisifyRedis(require('redis'));
const client = redis.createClient();

client.on('error', (err) => {
    console.log(err);
});

const set_redis = (key, time, JSON_value) => {
    client.setex(key, time, JSON.stringify(JSON_value));
    // console.log(`Set redis cache done.`)
}

const get_redis = (key) => {
    return client.get(key);
}

export {set_redis, get_redis};