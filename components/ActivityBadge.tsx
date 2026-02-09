import React from 'react';
import { ActivityType } from '../types';
import { BookOpen, Users, MessageCircle, FlaskConical, Gamepad2, Mic } from 'lucide-react';

interface ActivityBadgeProps {
  type: ActivityType;
}

export const ActivityBadge: React.FC<ActivityBadgeProps> = ({ type }) => {
  const config = {
    [ActivityType.LECTURE]: { icon: BookOpen, color: 'bg-blue-100 text-blue-700' },
    [ActivityType.QUESTION_ANSWER]: { icon: MessageCircle, color: 'bg-purple-100 text-purple-700' },
    [ActivityType.GROUP_WORK]: { icon: Users, color: 'bg-green-100 text-green-700' },
    [ActivityType.EXPERIMENT]: { icon: FlaskConical, color: 'bg-orange-100 text-orange-700' },
    [ActivityType.GAME]: { icon: Gamepad2, color: 'bg-pink-100 text-pink-700' },
    [ActivityType.DISCUSSION]: { icon: Mic, color: 'bg-yellow-100 text-yellow-700' },
  };

  const { icon: Icon, color } = config[type] || { icon: BookOpen, color: 'bg-gray-100 text-gray-700' };

  return (
    <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full ${color}`}>
      <Icon size={16} />
      <span className="text-sm font-semibold capitalize">{type}</span>
    </div>
  );
};
