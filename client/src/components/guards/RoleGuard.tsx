// src/components/guards/RoleGuard.tsx
import { Navigate } from 'react-router-dom';
import { useStore } from '../../store';

interface RoleGuardProps {
    children: React.ReactNode;
    allowedRoles?: string[];
    blockedRoles?: string[];
}

// Компонент для защиты маршрутов по ролям
const RoleGuard = ({ children, allowedRoles, blockedRoles }: RoleGuardProps) => {
    const { user } = useStore();

    // Если указаны заблокированные роли и пользователь имеет такую роль
    if (blockedRoles && user && blockedRoles.includes(user.role)) {
        // Редирект на панель админа/менеджера
        if (user.role === 'admin') {
            return <Navigate to="/admin" replace />;
        }
        if (user.role === 'manager') {
            return <Navigate to="/manager/games" replace />;
        }
    }

    // Если указаны разрешённые роли, проверяем доступ
    if (allowedRoles) {
        if (!user) {
            return <Navigate to="/login" replace />;
        }
        if (!allowedRoles.includes(user.role)) {
            return <Navigate to="/" replace />;
        }
    }

    return <>{children}</>;
};

export default RoleGuard;
