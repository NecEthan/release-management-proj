const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.sendStatus(401);
    }

    if (token) {
        next();
    } else {
        res.status(403).json({ error: 'Invalid token' });
    }
}

module.exports = authenticateToken;