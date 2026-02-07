import { 
  Database, 
  Server, 
  User, 
  BrainCircuit, 
  Globe, 
  FileText, 
  Settings, 
  Cloud,
  Code,
  AlertCircle,
  CheckCircle,
  HelpCircle
} from 'lucide-react';

export const getIcon = (iconName: string) => {
  // Normalize the string to lowercase to avoid mismatches
  const name = iconName?.toLowerCase();

  switch (name) {
    case 'database': return <Database size={20} />;
    case 'server': return <Server size={20} />;
    case 'user': return <User size={20} />;
    case 'ai': 
    case 'brain': return <BrainCircuit size={20} />;
    case 'web': 
    case 'globe': return <Globe size={20} />;
    case 'file': 
    case 'document': return <FileText size={20} />;
    case 'settings': 
    case 'config': return <Settings size={20} />;
    case 'cloud': return <Cloud size={20} />;
    case 'code': return <Code size={20} />;
    case 'error': return <AlertCircle size={20} />;
    case 'success': return <CheckCircle size={20} />;
    case 'question': return <HelpCircle size={20} />;
    default: return <Code size={20} />; // Default fallback
  }
};