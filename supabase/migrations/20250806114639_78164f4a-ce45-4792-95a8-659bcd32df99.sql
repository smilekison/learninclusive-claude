-- Add demo teachers for testing
DO $$
BEGIN
    -- Add demo teachers
    PERFORM public.create_demo_user('demoteacher@riverside.edu', 'demo123', 'Demo', 'Teacher', 'teacher');
    PERFORM public.create_demo_user('demoteacher1@riverside.edu', 'demo123', 'Demo', 'Teacher1', 'teacher');
    PERFORM public.create_demo_user('demoteacher2@riverside.edu', 'demo123', 'Demo', 'Teacher2', 'teacher');
    PERFORM public.create_demo_user('demoteacher3@riverside.edu', 'demo123', 'Demo', 'Teacher3', 'teacher');
    PERFORM public.create_demo_user('demoteacher4@riverside.edu', 'demo123', 'Demo', 'Teacher4', 'teacher');
EXCEPTION
    WHEN unique_violation THEN
        -- Teachers already exist, skip
        NULL;
END $$;