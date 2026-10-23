import { Link } from 'react-router-dom';
import { Compass } from 'lucide-react';
import EmptyState from '../components/EmptyState';

export default function NotFound() {
  return (
    <div className="pt-10">
      <EmptyState
        icon={Compass}
        title="Page not found"
        description="That page doesn't exist. Let's get you back to your tasks."
        action={
          <Link to="/dashboard" className="btn-primary">
            Back to dashboard
          </Link>
        }
      />
    </div>
  );
}
