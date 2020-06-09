import User from '../models/User';

const verifyId = async (id) => {
    try {
        const user = await User.findAll({
            attributes: ['id'],
            where: {
                id
            }
        })
        if (!user || user.length <= 0) {
            return 0
        } else {
            return user;
        }
    } catch (error) {
        return error
    }
}

export default verifyId;