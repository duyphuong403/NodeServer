import { verify } from 'jsonwebtoken';

const verifyToken = async (req, res, next) => {
    try {
        const token = req.header('authToken'); // or req.header('Authorization') 
        if (!token) return res.status(403).json({
            result: 'failed',
            data: {},
            message: 'authToken invalid'
        });

        req.user  = verify(token, process.env.TOKEN_SECRET);
        // console.log(req.user);
        next();
    } catch (e) {
        res.status(401).json({ result: 'failed', message: `Invalid token. ${e}` });
    }
};
export default verifyToken;