import React, { useState } from 'react';
import { useLocation } from 'react-router-dom';
import Icon from '../AppIcon';
import Button from './Button';

interface SidebarProps {
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
  isMobileOpen?: boolean;
  onMobileClose?: () => void;
}

interface NavigationItem {
  label: string;
  path: string;
  icon: string;
  description: string;
}

const Sidebar = ({ 
  isCollapsed = false, 
  onToggleCollapse, 
  isMobileOpen = false, 
  onMobileClose 
}: SidebarProps) => {
  const location = useLocation();

  const navigationItems: NavigationItem[] = [
    {
      label: 'Executive Overview',
      path: '/executive-kpi-dashboard',
      icon: 'TrendingUp',
      description: 'Strategic KPI dashboard and business intelligence'
    },
    {
      label: 'User Insights',
      path: '/user-analytics-monitor',
      icon: 'Users',
      description: 'User behavior analytics and engagement tracking'
    },
    {
      label: 'System Performance',
      path: '/operations-performance',
      icon: 'Activity',
      description: 'Real-time operations monitoring and technical analytics'
    },
    {
      label: 'Communication Analytics',
      path: '/communication-analytics',
      icon: 'MessageSquare',
      description: 'Notification delivery and engagement effectiveness'
    },
    {
      label: 'Notification Center',
      path: '/notification-center',
      icon: 'Bell',
      description: 'Create and manage notifications and surveys for mobile app'
    },
    {
      label: 'User Management',
      path: '/user-management',
      icon: 'UserPlus',
      description: 'Create and manage users for mobile app'
    }
  ];

  const isActiveRoute = (path: string) => {
    return location.pathname === path;
  };

  const handleNavigation = (path: string) => {
    window.location.href = path;
    if (onMobileClose) {
      onMobileClose();
    }
  };

  return (
    <>
      {/* Mobile Overlay */}
      {isMobileOpen && (
        <div 
          className="fixed inset-0 z-40 bg-background/80 backdrop-blur-sm lg:hidden"
          onClick={onMobileClose}
        />
      )}

      {/* Sidebar */}
      <aside 
        className={`
          fixed top-0 left-0 z-50 h-full bg-card border-r border-border transition-all duration-300 ease-in-out
          ${isCollapsed ? 'w-16' : 'w-60'}
          ${isMobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        `}
      >
        <div className="flex flex-col h-full">
          {/* Logo Section */}
          <div className="flex items-center justify-between p-4 border-b border-border">
            {!isCollapsed && (
              <div className="flex items-center space-x-3">
                <div className="flex items-center justify-center w-10 h-10 bg-primary rounded-lg">
                  <Icon name="BarChart3" size={24} color="white" />
                </div>
                <div className="flex flex-col">
                  <span className="text-lg font-semibold text-foreground">Conect@t</span>
                  <span className="text-xs text-muted-foreground -mt-1">Analytics Dashboard</span>
                </div>
              </div>
            )}
            
            {isCollapsed && (
              <div className="flex items-center justify-center w-full">
                <div className="flex items-center justify-center w-10 h-10 bg-primary rounded-lg">
                  <Icon name="BarChart3" size={24} color="white" />
                </div>
              </div>
            )}

            {/* Desktop Collapse Toggle */}
            <Button
              variant="ghost"
              size="icon"
              onClick={onToggleCollapse}
              className="hidden lg:flex button-press"
              aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            >
              <Icon name={isCollapsed ? 'ChevronRight' : 'ChevronLeft'} size={16} />
            </Button>

            {/* Mobile Close Button */}
            <Button
              variant="ghost"
              size="icon"
              onClick={onMobileClose}
              className="lg:hidden button-press"
              aria-label="Close sidebar"
            >
              <Icon name="X" size={20} />
            </Button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-4 space-y-2">
            {navigationItems.map((item) => {
              const isActive = isActiveRoute(item.path);
              
              return (
                <button
                  key={item.path}
                  onClick={() => handleNavigation(item.path)}
                  className={`
                    w-full flex items-center gap-3 px-3 py-3 rounded-lg text-left transition-all duration-200 ease-in-out
                    ${isActive 
                      ? 'bg-primary text-primary-foreground shadow-sm' 
                      : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                    }
                    ${isCollapsed ? 'justify-center' : 'justify-start'}
                  `}
                  title={isCollapsed ? item.description : undefined}
                >
                  <Icon 
                    name={item.icon} 
                    size={20} 
                    className={`flex-shrink-0 ${isActive ? 'text-primary-foreground' : ''}`}
                  />
                  
                  {!isCollapsed && (
                    <div className="flex flex-col min-w-0 flex-1">
                      <span className="font-medium text-sm truncate">
                        {item.label}
                      </span>
                      <span className={`text-xs truncate ${
                        isActive ? 'text-primary-foreground/80' : 'text-muted-foreground'
                      }`}>
                        {item.description}
                      </span>
                    </div>
                  )}
                </button>
              );
            })}
          </nav>

          {/* Footer */}
          <div className="p-4 border-t border-border">
            {!isCollapsed ? (
              <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/30">
                <div className="flex items-center justify-center w-8 h-8 bg-success rounded-full">
                  <Icon name="Zap" size={16} color="white" />
                </div>
                <div className="flex flex-col min-w-0 flex-1">
                  <span className="text-sm font-medium text-foreground">Real-time Active</span>
                  <span className="text-xs text-muted-foreground">All systems operational</span>
                </div>
              </div>
            ) : (
              <div className="flex justify-center">
                <div className="flex items-center justify-center w-8 h-8 bg-success rounded-full">
                  <Icon name="Zap" size={16} color="white" />
                </div>
              </div>
            )}
          </div>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;