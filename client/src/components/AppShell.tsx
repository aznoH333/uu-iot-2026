import {NavLink, Outlet, useNavigate} from 'react-router-dom';
import {useAuth} from '../auth/AuthContext';
import {Brand} from './Brand';

function DeviceIcon() {
    return <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
        <rect x="5" y="2.5" width="14" height="19" rx="2" stroke="currentColor" strokeWidth="2"/>
    </svg>;
}

function ConfigIcon() {
    return (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
            <circle cx="12" cy="12" r="2.2" fill="currentColor"/>
            <path d="M12 4v4M12 16v4M4 12h4M16 12h4" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            <path d="M17.5 6.5l-2.8 2.8M9.3 14.7l-2.8 2.8" stroke="currentColor" strokeWidth="2" strokeLinecap="round"
                  opacity=".45"/>
        </svg>
    );
}

export function AppShell() {
    const {user, logout} = useAuth()
    const navigate = useNavigate()

    const handleLogout = () => {
        logout()
        navigate('/login')
    }

    return (
        <div className="app-shell">
            <aside className="sidebar">
                <div className="sidebar-inner">
                    <Brand/>

                    <nav className="sidebar-nav">
                        <NavLink to="/devices" className={({isActive}) => `sidebar-link ${isActive ? 'active' : ''}`}>
                            <DeviceIcon/>
                            <span>Devices</span>
                        </NavLink>

                        <NavLink to="/configurations"
                                 className={({isActive}) => `sidebar-link ${isActive ? 'active' : ''}`}>
                            <ConfigIcon/>
                            <span>Configurations</span>
                        </NavLink>
                    </nav>
                </div>

                <div className="sidebar-bottom d-flex justify-content-between">
                    <div>
                        <div>
                            {user ? `${user.firstName} ${user.lastName}` : 'Nepřihlášený uživatel'}
                        </div>
                        <div className="text-grey fw-light" style={{fontSize: '11px'}}>
                            {user?.id}
                        </div>
                    </div>
                    <div>
                        <button className="btn btn-sm btn-outline-secondary text-nowrap"
                                onClick={handleLogout}>
                            Log out
                        </button>
                    </div>
                </div>
            </aside>

            <main className="main-content">
                <Outlet/>
            </main>
        </div>
    )
}