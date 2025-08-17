-- Update class names with realistic naming convention
UPDATE public.classes 
SET 
  name = CASE 
    WHEN name LIKE '%1%' OR name LIKE '%A%' THEN 'Grade 5A - Mathematics'
    WHEN name LIKE '%2%' OR name LIKE '%B%' THEN 'Grade 6B - Science'
    WHEN name LIKE '%3%' OR name LIKE '%C%' THEN 'Grade 7C - English Literature'
    WHEN name LIKE '%4%' OR name LIKE '%D%' THEN 'Grade 8A - History'
    WHEN name LIKE '%5%' OR name LIKE '%E%' THEN 'Grade 9B - Biology'
    ELSE 'Grade 6A - General Studies'
  END,
  description = CASE 
    WHEN name LIKE '%Math%' THEN 'Advanced mathematics course covering algebra, geometry, and problem-solving techniques'
    WHEN name LIKE '%Science%' THEN 'Comprehensive science program exploring physics, chemistry, and earth sciences'
    WHEN name LIKE '%English%' THEN 'Literature and composition course focusing on reading comprehension and writing skills'
    WHEN name LIKE '%History%' THEN 'World history course covering major civilizations and historical events'
    WHEN name LIKE '%Biology%' THEN 'Introduction to biological sciences including cell biology and ecosystems'
    ELSE 'Multidisciplinary course covering core academic subjects'
  END;

-- Update subject names with realistic academic subjects
UPDATE public.subjects 
SET 
  name = CASE 
    WHEN name LIKE '%jjj%' OR name LIKE '%aaa%' OR name LIKE '%test%' THEN 'Mathematics'
    WHEN name LIKE '%bbb%' OR name LIKE '%yyy%' THEN 'Science'
    WHEN name LIKE '%ccc%' OR name LIKE '%zzz%' THEN 'English Language Arts'
    WHEN name LIKE '%ddd%' OR name LIKE '%www%' THEN 'Social Studies'
    WHEN name LIKE '%eee%' OR name LIKE '%xxx%' THEN 'Physical Education'
    WHEN name LIKE '%fff%' OR name LIKE '%vvv%' THEN 'Art'
    WHEN name LIKE '%ggg%' OR name LIKE '%uuu%' THEN 'Music'
    WHEN name LIKE '%hhh%' OR name LIKE '%ttt%' THEN 'Computer Science'
    WHEN name LIKE '%iii%' OR name LIKE '%sss%' THEN 'Biology'
    WHEN name LIKE '%kkk%' OR name LIKE '%rrr%' THEN 'Chemistry'
    ELSE 'General Studies'
  END,
  description = CASE 
    WHEN name = 'Mathematics' THEN 'Comprehensive mathematics curriculum covering arithmetic, algebra, geometry, and statistical analysis'
    WHEN name = 'Science' THEN 'Integrated science program exploring natural phenomena through observation, experimentation, and analysis'
    WHEN name = 'English Language Arts' THEN 'Language arts course focusing on reading, writing, speaking, and listening skills development'
    WHEN name = 'Social Studies' THEN 'Study of human society, history, geography, and civic responsibility'
    WHEN name = 'Physical Education' THEN 'Physical fitness and health education promoting active lifestyles and team collaboration'
    WHEN name = 'Art' THEN 'Visual arts education exploring creativity, artistic techniques, and cultural expression'
    WHEN name = 'Music' THEN 'Music education program covering performance, theory, and music appreciation'
    WHEN name = 'Computer Science' THEN 'Introduction to programming, digital literacy, and computational thinking'
    WHEN name = 'Biology' THEN 'Study of living organisms, ecosystems, and biological processes'
    WHEN name = 'Chemistry' THEN 'Exploration of matter, chemical reactions, and molecular structures'
    ELSE 'Multidisciplinary studies covering various academic topics'
  END;

-- Update assignment titles with realistic academic assignments
UPDATE public.assignments 
SET 
  title = CASE 
    WHEN title LIKE '%test%' OR title LIKE '%aaa%' THEN 'Algebraic Equations Worksheet'
    WHEN title LIKE '%assignment%' OR title LIKE '%bbb%' THEN 'Scientific Method Lab Report'
    WHEN title LIKE '%homework%' OR title LIKE '%ccc%' THEN 'Essay on American Revolution'
    WHEN title LIKE '%project%' OR title LIKE '%ddd%' THEN 'Ecosystem Research Project'
    WHEN title LIKE '%quiz%' OR title LIKE '%eee%' THEN 'Grammar and Vocabulary Quiz'
    WHEN title LIKE '%exam%' OR title LIKE '%fff%' THEN 'Geometry Problem Set'
    WHEN title LIKE '%paper%' OR title LIKE '%ggg%' THEN 'Creative Writing Assignment'
    WHEN title LIKE '%study%' OR title LIKE '%hhh%' THEN 'Historical Timeline Project'
    WHEN title LIKE '%review%' OR title LIKE '%iii%' THEN 'Chemistry Lab Experiment'
    ELSE 'Reading Comprehension Exercise'
  END,
  description = CASE 
    WHEN title LIKE '%Algebraic%' THEN 'Complete the provided worksheet on solving linear and quadratic equations. Show all work and check your answers.'
    WHEN title LIKE '%Scientific%' THEN 'Write a detailed lab report following the scientific method for our recent experiment on plant growth.'
    WHEN title LIKE '%American Revolution%' THEN 'Write a 500-word essay analyzing the causes and effects of the American Revolution.'
    WHEN title LIKE '%Ecosystem%' THEN 'Research and present on a specific ecosystem, including its components and environmental challenges.'
    WHEN title LIKE '%Grammar%' THEN 'Complete the grammar exercises and vocabulary definitions for chapters 8-10.'
    WHEN title LIKE '%Geometry%' THEN 'Solve the geometric problems involving area, perimeter, and volume calculations.'
    WHEN title LIKE '%Creative Writing%' THEN 'Write a short story (300-500 words) incorporating the literary elements we have studied.'
    WHEN title LIKE '%Historical Timeline%' THEN 'Create a detailed timeline of World War II events with explanations and significance.'
    WHEN title LIKE '%Chemistry Lab%' THEN 'Conduct the acid-base neutralization experiment and record observations and conclusions.'
    ELSE 'Read the assigned chapter and answer the comprehension questions at the end.'
  END;