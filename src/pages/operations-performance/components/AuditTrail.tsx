import React, { useState } from 'react';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';
import Input from '../../../components/ui/Input';
import Select from '../../../components/ui/Select';
import { AuditLogEntry } from '../types';

interface AuditTrailProps {
  logs: AuditLogEntry[];
  onLoadMore?: () => void;
  hasMore?: boolean;
}

const AuditTrail: React.FC<AuditTrailProps> = ({ logs, onLoadMore, hasMore = false }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterSeverity, setFilterSeverity] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');

  const severityOptions = [
    { value: 'all', label: 'All Severities' },
    { value: 'info', label: 'Info' },
    { value: 'warning', label: 'Warning' },
    { value: 'error', label: 'Error' }
  ];

  const statusOptions = [
    { value: 'all', label: 'All Status' },
    { value: 'success', label: 'Success' },
    { value: 'failed', label: 'Failed' },
    { value: 'pending', label: 'Pending' }
  ];

  const getSeverityColor = (severity: AuditLogEntry['severity']) => {
    switch (severity) {
      case 'error':
        return 'text-error bg-error/10 border-error/20';
      case 'warning':
        return 'text-warning bg-warning/10 border-warning/20';
      case 'info':
        return 'text-accent bg-accent/10 border-accent/20';
      default:
        return 'text-muted-foreground bg-muted/10 border-muted/20';
    }
  };

  const getStatusColor = (status: AuditLogEntry['status']) => {
    switch (status) {
      case 'success':
        return 'text-success bg-success/10';
      case 'failed':
        return 'text-error bg-error/10';
      case 'pending':
        return 'text-warning bg-warning/10';
      default:
        return 'text-muted-foreground bg-muted/10';
    }
  };

  const getStatusIcon = (status: AuditLogEntry['status']) => {
    switch (status) {
      case 'success':
        return 'CheckCircle';
      case 'failed':
        return 'XCircle';
      case 'pending':
        return 'Clock';
      default:
        return 'Circle';
    }
  };

  const getSeverityIcon = (severity: AuditLogEntry['severity']) => {
    switch (severity) {
      case 'error':
        return 'AlertCircle';
      case 'warning':
        return 'AlertTriangle';
      case 'info':
        return 'Info';
      default:
        return 'Circle';
    }
  };

  const filteredLogs = logs.filter(log => {
    const matchesSearch = searchTerm === '' || 
      log.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.user.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.resource.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesSeverity = filterSeverity === 'all' || log.severity === filterSeverity;
    const matchesStatus = filterStatus === 'all' || log.status === filterStatus;
    
    return matchesSearch && matchesSeverity && matchesStatus;
  });

  return (
    <div className="bg-card rounded-lg border border-border p-6 h-full flex flex-col">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-lg font-semibold text-foreground">Audit Trail</h3>
          <p className="text-sm text-muted-foreground">Administrative actions and system events</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" iconName="Download" iconSize={14}>
            Export
          </Button>
          <Button variant="outline" size="sm" iconName="RefreshCw" iconSize={14}>
            Refresh
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
        <Input
          type="search"
          placeholder="Search actions, users, resources..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        <Select
          options={severityOptions}
          value={filterSeverity}
          onChange={setFilterSeverity}
          placeholder="Filter by severity"
        />
        <Select
          options={statusOptions}
          value={filterStatus}
          onChange={setFilterStatus}
          placeholder="Filter by status"
        />
      </div>

      {/* Logs List */}
      <div className="flex-1 overflow-y-auto space-y-3">
        {filteredLogs.map((log) => (
          <div key={log.id} className="p-4 bg-muted/30 rounded-lg border border-border hover:bg-muted/50 transition-colors">
            <div className="flex items-start justify-between mb-2">
              <div className="flex items-center gap-3">
                <div className={`p-1 rounded-full border ${getSeverityColor(log.severity)}`}>
                  <Icon name={getSeverityIcon(log.severity)} size={14} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-medium text-foreground text-sm">{log.action}</span>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(log.status)}`}>
                      {log.status}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Resource: <span className="font-medium">{log.resource}</span>
                  </p>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                <Icon name={getStatusIcon(log.status)} size={16} className={getStatusColor(log.status).split(' ')[0]} />
                <span className="text-xs text-muted-foreground">
                  {log.timestamp.toLocaleTimeString()}
                </span>
              </div>
            </div>

            <div className="ml-8 space-y-1 text-xs text-muted-foreground">
              <div className="flex items-center gap-4">
                <span>User: <span className="font-medium text-foreground">{log.user}</span></span>
                <span>Role: <span className="font-medium">{log.userRole}</span></span>
                <span>IP: <span className="font-mono">{log.ipAddress}</span></span>
              </div>
              {log.details && (
                <p className="text-foreground/80 mt-1">{log.details}</p>
              )}
            </div>
          </div>
        ))}

        {filteredLogs.length === 0 && (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <Icon name="Search" size={48} className="text-muted-foreground mb-4" />
            <h4 className="text-lg font-medium text-foreground mb-2">No logs found</h4>
            <p className="text-sm text-muted-foreground">
              Try adjusting your search criteria or filters
            </p>
          </div>
        )}
      </div>

      {/* Load More */}
      {hasMore && (
        <div className="mt-4 pt-4 border-t border-border">
          <Button
            variant="outline"
            onClick={onLoadMore}
            className="w-full"
            iconName="ChevronDown"
            iconSize={16}
          >
            Load More Entries
          </Button>
        </div>
      )}

      {/* Summary */}
      <div className="mt-4 pt-4 border-t border-border">
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>Showing {filteredLogs.length} of {logs.length} entries</span>
          <span>Last updated: {new Date().toLocaleTimeString()}</span>
        </div>
      </div>
    </div>
  );
};

export default AuditTrail;