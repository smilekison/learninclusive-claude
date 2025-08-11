import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export type AssignmentStatusFilter = 'all' | 'overdue' | 'due_soon' | 'no_due_date' | 'active';

export interface PrincipalAssignmentFilters {
  classId?: string;
  teacherId?: string; // profiles.id
  status?: AssignmentStatusFilter;
}

export interface AssignmentSummary {
  total: number;
  overdue: number;
  dueSoon: number;
  noDueDate: number;
}

export interface GroupCount { id: string; name: string; count: number }

export interface PrincipalAssignmentAnalytics {
  summary: AssignmentSummary;
  byClass: GroupCount[];
  byTeacher: GroupCount[];
}

export interface TeacherAssignmentAnalytics {
  summary: AssignmentSummary;
  bySubject: GroupCount[];
}

function computeStatusCounts(assignments: any[]): AssignmentSummary {
  const now = new Date();
  const soon = new Date();
  soon.setDate(soon.getDate() + 7);

  let overdue = 0, dueSoon = 0, noDueDate = 0, active = 0;

  assignments.forEach((a) => {
    const due = a.due_date ? new Date(a.due_date) : null;
    if (!due) {
      noDueDate++;
      active++; // treat as active
      return;
    }
    if (due < now) overdue++;
    else if (due >= now && due <= soon) dueSoon++;
    else active++;
  });

  return {
    total: assignments.length,
    overdue,
    dueSoon,
    noDueDate,
  };
}

function applyStatusFilter(assignments: any[], status?: AssignmentStatusFilter) {
  if (!status || status === 'all') return assignments;
  const now = new Date();
  const soon = new Date();
  soon.setDate(soon.getDate() + 7);
  return assignments.filter((a) => {
    const due = a.due_date ? new Date(a.due_date) : null;
    switch (status) {
      case 'overdue':
        return !!due && due < now;
      case 'due_soon':
        return !!due && due >= now && due <= soon;
      case 'no_due_date':
        return !due;
      case 'active':
        return !due || due >= now;
      default:
        return true;
    }
  });
}

export const usePrincipalAssignmentAnalytics = (filters: PrincipalAssignmentFilters) => {
  return useQuery({
    queryKey: ['principal-assignment-analytics', filters],
    queryFn: async (): Promise<PrincipalAssignmentAnalytics> => {
      const { data: assignments } = await supabase
        .from('assignments')
        .select(`
          id,
          title,
          due_date,
          created_at,
          subject:subjects!inner(
            id,
            name,
            class:classes!inner(
              id,
              name,
              teacher:profiles!classes_teacher_id_fkey(id, first_name, last_name)
            )
          )
        `)
        .eq('is_active', true);

      let list = assignments || [];
      if (filters.classId) {
        list = list.filter((a: any) => a.subject?.class?.id === filters.classId);
      }
      if (filters.teacherId) {
        list = list.filter((a: any) => a.subject?.class?.teacher?.id === filters.teacherId);
      }
      if (filters.status && filters.status !== 'all') {
        list = applyStatusFilter(list, filters.status);
      }

      const summary = computeStatusCounts(list);

      const classMap = new Map<string, GroupCount>();
      const teacherMap = new Map<string, GroupCount>();

      list.forEach((a: any) => {
        const c = a.subject?.class;
        if (c) {
          const prev = classMap.get(c.id) || { id: c.id, name: c.name, count: 0 };
          prev.count += 1;
          classMap.set(c.id, prev);
        }
        const t = a.subject?.class?.teacher;
        if (t) {
          const tname = `${t.first_name || ''} ${t.last_name || ''}`.trim() || 'Unknown';
          const prev = teacherMap.get(t.id) || { id: t.id, name: tname, count: 0 };
          prev.count += 1;
          teacherMap.set(t.id, prev);
        }
      });

      return {
        summary,
        byClass: Array.from(classMap.values()).sort((a, b) => b.count - a.count),
        byTeacher: Array.from(teacherMap.values()).sort((a, b) => b.count - a.count),
      };
    },
  });
};

export const useTeacherAssignmentAnalytics = () => {
  return useQuery({
    queryKey: ['teacher-assignment-analytics'],
    queryFn: async (): Promise<TeacherAssignmentAnalytics> => {
      const { data: profile } = await supabase
        .from('profiles')
        .select('id')
        .eq('user_id', (await supabase.auth.getUser()).data.user?.id)
        .maybeSingle();

      if (!profile) {
        return {
          summary: { total: 0, overdue: 0, dueSoon: 0, noDueDate: 0 },
          bySubject: [],
        };
      }

      const { data: assignments } = await supabase
        .from('assignments')
        .select(`
          id,
          title,
          due_date,
          subject:subjects!inner(
            id,
            name,
            class:classes!inner(id, name, teacher_id)
          )
        `)
        .eq('subjects.classes.teacher_id', profile.id)
        .eq('is_active', true);

      const list = assignments || [];
      const summary = computeStatusCounts(list);

      const subjectMap = new Map<string, GroupCount>();
      list.forEach((a: any) => {
        const s = a.subject;
        if (s) {
          const prev = subjectMap.get(s.id) || { id: s.id, name: s.name, count: 0 };
          prev.count += 1;
          subjectMap.set(s.id, prev);
        }
      });

      return {
        summary,
        bySubject: Array.from(subjectMap.values()).sort((a, b) => b.count - a.count),
      };
    },
  });
};
