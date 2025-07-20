# Table Column Information

## class_announcements

| column_name | data_type | character_maximum_length | is_nullable | column_default |
| :--- | :--- | :--- | :--- | :--- |
| id | uuid | | NO | gen_random_uuid() |
| class_id | uuid | | NO | |
| teacher_id | uuid | | NO | |
| created_at | timestamp with time zone | | YES | now() |
| message | text | | NO | |

## class_assignment_progress

| column_name | data_type | character_maximum_length | is_nullable | column_default |
| :--- | :--- | :--- | :--- | :--- |
| class_exercise_id | uuid | | NO | |
| student_id | uuid | | NO | |
| best_score | integer | | YES | |
| attempts_count | integer | | NO | 0 |
| status | USER-DEFINED | | NO | 'not_started'::progress_status_enum |
| first_attempted_at | timestamp with time zone | | YES | |
| last_attempted_at | timestamp with time zone | | YES | |
| completed_at | timestamp with time zone | | YES | |

## class_exercises

| column_name | data_type | character_maximum_length | is_nullable | column_default |
| :--- | :--- | :--- | :--- | :--- |
| id | uuid | | NO | gen_random_uuid() |
| class_id | uuid | | NO | |
| exercise_id | uuid | | NO | |
| is_active | boolean | | NO | true |
| is_required | boolean | | NO | true |
| assigned_at | timestamp with time zone | | YES | now() |
| due_date | timestamp with time zone | | YES | |
| available_from | timestamp with time zone | | YES | now() |
| available_until | timestamp with time zone | | YES | |
| max_attempts | integer | | YES | |
| time_limit | integer | | YES | |
| minimum_passing_grade | integer | | YES | |
| randomize_questions | boolean | | NO | false |
| show_answers_policy | USER-DEFINED | | NO | 'Immediately'::show_answers_policy_enum |

## class_students

| column_name | data_type | character_maximum_length | is_nullable | column_default |
| :--- | :--- | :--- | :--- | :--- |
| is_active | boolean | | NO | true |
| class_id | uuid | | NO | |
| student_id | uuid | | NO | |
| id | uuid | | NO | gen_random_uuid() |
| left_at | timestamp with time zone | | YES | |
| joined_at | timestamp with time zone | | YES | now() |
| role | text | | YES | 'student'::text |

## classes

| column_name | data_type | character_maximum_length | is_nullable | column_default |
| :--- | :--- | :--- | :--- | :--- |
| id | uuid | | NO | gen_random_uuid() |
| teacher_id | uuid | | NO | |
| max_students | integer | | YES | 50 |
| is_active | boolean | | NO | true |
| is_archived | boolean | | NO | false |
| settings | jsonb | | YES | '{}'::jsonb |
| created_at | timestamp with time zone | | YES | now() |
| updated_at | timestamp with time zone | | YES | now() |
| name | text | | NO | |
| description | text | | NO | ''::text |
| semester | text | | YES | |
| class_code | text | | NO | |
| subject | text | | YES | |
| grade_level | text | | YES | |
| school_year | text | | YES | |

## classes_with_student_count

| column_name | data_type | character_maximum_length | is_nullable | column_default |
| :--- | :--- | :--- | :--- | :--- |
| student_count | bigint | | YES | |
| created_at | timestamp with time zone | | YES | |
| teacher_id | uuid | | YES | |
| is_active | boolean | | YES | |
| id | uuid | | YES | |
| name | text | | YES | |
| description | text | | YES | |
| class_code | text | | YES | |

## curriculum

| column_name | data_type | character_maximum_length | is_nullable | column_default |
| :--- | :--- | :--- | :--- | :--- |
| id | integer | | NO | nextval('curriculum_id_seq'::regclass) |
| subject | character varying | 255 | NO | |
| grade | text | | NO | |
| chapter | character varying | 255 | NO | |
| topic | text | | NO | |
| sub_topic | text | | YES | |
| sub_sub_topic | text | | YES | |
| curriculum_type | text | | NO | |
| language | text | | NO | |
| semester | text | | YES | |

## exercise_attempts

| column_name | data_type | character_maximum_length | is_nullable | column_default |
| :--- | :--- | :--- | :--- | :--- |
| id | uuid | | NO | gen_random_uuid() |
| exercise_id | uuid | | NO | |
| user_id | uuid | | NO | |
| attempt_number | integer | | YES | 1 |
| answers | jsonb | | NO | '[]'::jsonb |
| score | integer | | NO | 0 |
| max_score | integer | | NO | 0 |
| percentage | real | | YES | |
| time_elapsed | integer | | NO | 0 |
| is_completed | boolean | | NO | false |
| is_submitted | boolean | | NO | false |
| feedback | jsonb | | YES | '{}'::jsonb |
| started_at | timestamp with time zone | | YES | now() |
| completed_at | timestamp with time zone | | YES | |
| submitted_at | timestamp with time zone | | YES | |
| class_exercise_id | uuid | | YES | |
| status | USER-DEFINED | | YES | |

## exercise_comments

| column_name | data_type | character_maximum_length | is_nullable | column_default |
| :--- | :--- | :--- | :--- | :--- |
| id | uuid | | NO | gen_random_uuid() |
| exercise_id | uuid | | NO | |
| user_id | uuid | | NO | |
| parent_id | uuid | | YES | |
| updated_at | timestamp with time zone | | YES | now() |
| is_edited | boolean | | YES | false |
| is_deleted | boolean | | YES | false |
| created_at | timestamp with time zone | | YES | now() |
| content | text | | NO | |

## exercise_likes

| column_name | data_type | character_maximum_length | is_nullable | column_default |
| :--- | :--- | :--- | :--- | :--- |
| id | uuid | | NO | gen_random_uuid() |
| exercise_id | uuid | | NO | |
| user_id | uuid | | NO | |
| created_at | timestamp with time zone | | YES | now() |

## exercises

| column_name | data_type | character_maximum_length | is_nullable | column_default |
| :--- | :--- | :--- | :--- | :--- |
| id | uuid | | NO | gen_random_uuid() |
| created_at | timestamp with time zone | | YES | now() |
| updated_at | timestamp with time zone | | YES | now() |
| minimum_passing_grade | integer | | YES | |
| questions | jsonb | | YES | |
| curriculum_type | USER-DEFINED | | YES | |
| semester | USER-DEFINED | | YES | |
| question_types | ARRAY | | YES | |
| difficulty | USER-DEFINED | | NO | 'medium'::difficulty_level |
| estimated_duration | integer | | YES | 30 |
| is_public | boolean | | NO | false |
| is_featured | boolean | | NO | false |
| creator_id | uuid | | NO | |
| metadata | jsonb | | YES | '{}'::jsonb |
| view_count | integer | | YES | 0 |
| like_count | integer | | YES | 0 |
| title | text | | NO | |
| description | text | | NO | ''::text |
| subject | text | | NO | |
| grade | text | | NO | |
| material | text | | YES | |
| assessment_type | text | | YES | |
| tags | ARRAY | | YES | '{}'::text[] |

## notifications

| column_name | data_type | character_maximum_length | is_nullable | column_default |
| :--- | :--- | :--- | :--- | :--- |
| id | uuid | | NO | gen_random_uuid() |
| user_id | uuid | | NO | |
| is_read | boolean | | YES | false |
| created_at | timestamp with time zone | | YES | now() |
| type | USER-DEFINED | | YES | |
| message | text | | NO | |

## parent_assignments

| column_name | data_type | character_maximum_length | is_nullable | column_default |
| :--- | :--- | :--- | :--- | :--- |
| id | bigint | | NO | |
| parent_id | uuid | | NO | |
| child_id | uuid | | NO | |
| exercise_id | uuid | | NO | |
| assigned_at | timestamp with time zone | | NO | now() |
| completed_at | timestamp with time zone | | YES | |
| score | integer | | YES | |
| created_at | timestamp with time zone | | NO | now() |

## parent_child_link

| column_name | data_type | character_maximum_length | is_nullable | column_default |
| :--- | :--- | :--- | :--- | :--- |
| id | bigint | | NO | |
| parent_id | uuid | | NO | |
| child_id | uuid | | NO | |
| created_at | timestamp with time zone | | NO | now() |

## parent_invitations

| column_name | data_type | character_maximum_length | is_nullable | column_default |
| :--- | :--- | :--- | :--- | :--- |
| child_id | uuid | | YES | |
| parent_id | uuid | | NO | |
| created_at | timestamp with time zone | | NO | now() |
| updated_at | timestamp with time zone | | NO | now() |
| id | uuid | | NO | gen_random_uuid() |
| child_email | text | | YES | |
| status | text | | NO | 'pending'::text |

## questions

| column_name | data_type | character_maximum_length | is_nullable | column_default |
| :--- | :--- | :--- | :--- | :--- |
| id | uuid | | NO | gen_random_uuid() |
| exercise_id | uuid | | NO | |
| metadata | jsonb | | YES | '{}'::jsonb |
| created_at | timestamp with time zone | | YES | now() |
| leftItems | jsonb | | YES | |
| rightItems | jsonb | | YES | |
| options | jsonb | | YES | |
| answer | jsonb | | YES | |
| difficulty | USER-DEFINED | | NO | 'medium'::difficulty_level |
| points | integer | | YES | 1 |
| order_index | integer | | NO | 0 |
| type | text | | YES | |
| question | text | | YES | |
| explanation | text | | YES | |
| hints | ARRAY | | YES | |

## user_progress

| column_name | data_type | character_maximum_length | is_nullable | column_default |
| :--- | :--- | :--- | :--- | :--- |
| user_id | uuid | | NO | |
| exercise_id | uuid | | NO | |
| best_score_overall | integer | | NO | 0 |
| attempts_count | integer | | NO | 0 |
| is_mastered | boolean | | NO | false |
| last_attempt_at | timestamp with time zone | | YES | |

## users

| column_name | data_type | character_maximum_length | is_nullable | column_default |
| :--- | :--- | :--- | :--- | :--- |
| id | uuid | | NO | |
| email_confirmed_at | timestamp with time zone | | YES | |
| invited_at | timestamp with time zone | | YES | |
| confirmation_sent_at | timestamp with time zone | | YES | |
| recovery_sent_at | timestamp with time zone | | YES | |
| email_change_sent_at | timestamp with time zone | | YES | |
| last_sign_in_at | timestamp with time zone | | YES | |
| raw_app_meta_data | jsonb | | YES | |
| raw_user_meta_data | jsonb | | YES | |
| is_super_admin | boolean | | YES | |
| created_at | timestamp with time zone | | YES | |
| updated_at | timestamp with time zone | | YES | |
| phone_confirmed_at | timestamp with time zone | | YES | |
| phone_change_sent_at | timestamp with time zone | | YES | |
| confirmed_at | timestamp with time zone | | YES | |
| email_change_confirm_status | smallint | | YES | 0 |
| banned_until | timestamp with time zone | | YES | |
| reauthentication_sent_at | timestamp with time zone | | YES | |
| is_sso_user | boolean | | NO | false |
| deleted_at | timestamp with time zone | | YES | |
| is_anonymous | boolean | | NO | false |
| role | USER-DEFINED | | NO | 'student'::user_role |
| preferences | jsonb | | YES | '{}'::jsonb |
| is_active | boolean | | NO | true |
| last_login | timestamp with time zone | | YES | |
| instance_id | uuid | | YES | |
| email | text | | NO | |
| name | text | | NO | |
| phone | text | | YES | NULL::character varying |
| avatar_url | text | | YES | |
| bio | text | | YES | |
| school | text | | YES | |
| grade_level | text | | YES | |
| subjects | ARRAY | | YES | |
| confirmation_token | character varying | 255 | YES | |
| reauthentication_token | character varying | 255 | YES | ''::character varying |
| recovery_token | character varying | 255 | YES | |
| phone_change | text | | YES | ''::character varying |
| email_change_token_new | character varying | 255 | YES | |
| child_code | text | | YES | |
| email_change | character varying | 255 | YES | |
| phone_change_token | character varying | 255 | YES | ''::character varying |
| aud | character varying | 255 | YES | |
| role | character varying | 255 | YES | |
| encrypted_password | character varying | 255 | YES | |
| email_change_token_current | character varying | 255 | YES | ''::character varying |
