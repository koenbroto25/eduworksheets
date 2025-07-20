import React, { useState } from 'react';
import { User, Mail, Calendar, UserMinus, Search } from 'lucide-react';
import { Button } from '../common/Button';
import { SearchBar } from '../common/SearchBar';
import { User as UserType } from '../../types';

interface StudentListProps {
  students: UserType[];
  onRemoveStudent?: (studentId: string) => void;
  showActions?: boolean;
}

export const StudentList: React.FC<StudentListProps> = ({
  students,
  onRemoveStudent,
  showActions = false
}) => {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredStudents = students.filter(student =>
    student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    student.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (students.length === 0) {
    return (
      <div className="text-center py-12">
        <User className="h-16 w-16 text-gray-300 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">
          No students in this class
        </h3>
        <p className="text-gray-500">
          Add students to start sharing exercises with them
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {students.length > 5 && (
        <SearchBar
          value={searchTerm}
          onChange={setSearchTerm}
          placeholder="Search students..."
        />
      )}

      <div className="space-y-3">
        {filteredStudents.map((student) => (
          <div
            key={student.id}
            className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <div className="flex items-center space-x-4">
              <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                <User className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <h4 className="font-medium text-gray-900">{student.name}</h4>
                <div className="flex items-center space-x-4 text-sm text-gray-500">
                  <div className="flex items-center">
                    <Mail className="h-3 w-3 mr-1" />
                    {student.email}
                  </div>
                  <div className="flex items-center">
                    <Calendar className="h-3 w-3 mr-1" />
                    Joined {new Date(student.createdAt).toLocaleDateString()}
                  </div>
                </div>
              </div>
            </div>
            
            {showActions && onRemoveStudent && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  if (confirm(`Remove ${student.name} from this class?`)) {
                    onRemoveStudent(student.id);
                  }
                }}
                className="text-red-600 hover:text-red-700 hover:bg-red-50"
              >
                <UserMinus className="h-4 w-4" />
              </Button>
            )}
          </div>
        ))}
      </div>

      {filteredStudents.length === 0 && searchTerm && (
        <div className="text-center py-8">
          <Search className="h-12 w-12 text-gray-300 mx-auto mb-2" />
          <p className="text-gray-500">No students found matching "{searchTerm}"</p>
        </div>
      )}
    </div>
  );
};