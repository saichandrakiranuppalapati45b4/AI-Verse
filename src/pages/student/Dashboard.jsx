import { ParticipantsManagement } from '../admin/ParticipantsManagement';
import { StudentLayout } from '../../components/layout/StudentLayout';

export const StudentDashboard = () => {
    return (
        <StudentLayout>
            <ParticipantsManagement />
        </StudentLayout>
    );
};
