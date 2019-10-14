from functools import wraps

from SmartDjango import Excp, E

from Base.jtoken import JWT
from User.models import User


@E.register
class AuthError:
    REQUIRE_LOGIN = E("需要登录", hc=401)
    TOKEN_MISS_PARAM = E("认证口令缺少参数{0}", E.PH_FORMAT, hc=400)


class Auth:
    @staticmethod
    @Excp.pack
    def validate_token(request):
        jwt_str = request.META.get('HTTP_TOKEN')
        if jwt_str is None:
            return AuthError.REQUIRE_LOGIN

        return JWT.decrypt(jwt_str)

    @staticmethod
    def get_login_token(user: User):
        token, _dict = JWT.encrypt(dict(
            user_id=user.qt_user_app_id,
        ))
        _dict['token'] = token
        _dict['user'] = user.d()
        return _dict

    @classmethod
    @Excp.pack
    def _extract_user(cls, r):
        r.user = None

        dict_ = cls.validate_token(r)
        user_id = dict_.get('user_id')
        if not user_id:
            return AuthError.TOKEN_MISS_PARAM('user_id')

        from User.models import User
        r.user = User.get_by_qt_user_app_id(user_id)

    @classmethod
    def require_login(cls, func):
        @wraps(func)
        def wrapper(r, *args, **kwargs):
            cls._extract_user(r)
            return func(r, *args, **kwargs)
        return wrapper
