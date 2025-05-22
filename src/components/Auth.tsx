import React, { useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { UserRole } from '../types/models';

const Auth: React.FC = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [role, setRole] = useState<UserRole>(UserRole.MEMBER);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { signup, login } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (isLogin) {
        await login(email, password);
      } else {
        await signup(email, password, {
          name,
          phone,
          role,
          groupId: undefined,
          isOnline: true,
          lastSeen: new Date()
        });
      }
    } catch (err: any) {
      setError(err.message || 'Произошла ошибка');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-header">
        <h1>🎵 BandSync Web</h1>
        <p>Управление музыкальной группой</p>
      </div>
      
      <div className="auth-tabs">
        <button 
          className={isLogin ? 'active' : ''}
          onClick={() => setIsLogin(true)}
        >
          Вход
        </button>
        <button 
          className={!isLogin ? 'active' : ''}
          onClick={() => setIsLogin(false)}
        >
          Регистрация
        </button>
      </div>
      
      <form onSubmit={handleSubmit} className="auth-form">
        <h2>{isLogin ? 'Войти в BandSync' : 'Регистрация в BandSync'}</h2>
        
        {!isLogin && (
          <div className="form-group">
            <input
              type="text"
              placeholder="Имя"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>
        )}
        
        <div className="form-group">
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>
        
        {!isLogin && (
          <div className="form-group">
            <input
              type="tel"
              placeholder="Телефон"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              required
            />
          </div>
        )}
        
        {!isLogin && (
          <div className="form-group">
            <select
              value={role}
              onChange={(e) => setRole(e.target.value as UserRole)}
            >
              <option value={UserRole.MEMBER}>Участник</option>
              <option value={UserRole.MUSICIAN}>Музыкант</option>
              <option value={UserRole.MANAGER}>Менеджер</option>
              <option value={UserRole.ADMIN}>Администратор</option>
            </select>
          </div>
        )}
        
        <div className="form-group">
          <input
            type="password"
            placeholder="Пароль"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>
        
        {error && <div className="error">{error}</div>}
        
        <button type="submit" disabled={loading}>
          {loading ? 'Загрузка...' : (isLogin ? 'Войти' : 'Зарегистрироваться')}
        </button>
      </form>
    </div>
  );
};

export default Auth;
