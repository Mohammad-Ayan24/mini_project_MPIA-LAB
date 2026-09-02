SET local check_function_bodies = off;

CREATE SEQUENCE "public"."admission_application_number_seq" AS bigint INCREMENT BY 1 MINVALUE 1 MAXVALUE 9223372036854775807 START WITH 1 CACHE 1 NO CYCLE;

CREATE SEQUENCE "public"."admission_number_seq" AS bigint INCREMENT BY 1 MINVALUE 1 MAXVALUE 9223372036854775807 START WITH 1 CACHE 1 NO CYCLE;

CREATE TABLE "public"."academic_records" (
  "id"               uuid                     NOT NULL DEFAULT gen_random_uuid(),
  "admission_number" text                     NOT NULL,
  "academic_year_id" uuid                     NOT NULL,
  "marks_percentage" numeric(5,2),
  "working_days"     integer,
  "days_attended"    integer,
  "created_at"       timestamp with time zone NOT NULL DEFAULT now(),
  "updated_at"       timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT "academic_records_admission_number_academic_year_id_key" UNIQUE (admission_number, academic_year_id),
  CONSTRAINT "academic_records_check" CHECK (((working_days IS NULL) OR (days_attended IS NULL) OR (days_attended <= working_days))),
  CONSTRAINT "academic_records_days_attended_check" CHECK (((days_attended IS NULL) OR (days_attended >= 0))),
  CONSTRAINT "academic_records_marks_percentage_check" CHECK (((marks_percentage IS NULL) OR ((marks_percentage >= (0)::numeric) AND (marks_percentage <= (100)::numeric)))),
  CONSTRAINT "academic_records_pkey" PRIMARY KEY (id),
  CONSTRAINT "academic_records_working_days_check" CHECK (((working_days IS NULL) OR (working_days >= 0)))
);

ALTER TABLE "public"."academic_records"
  ENABLE ROW LEVEL SECURITY;

CREATE TABLE "public"."academic_years" (
  "id"         uuid                     NOT NULL DEFAULT gen_random_uuid(),
  "name"       text                     NOT NULL,
  "start_date" date,
  "end_date"   date,
  "is_current" boolean                  NOT NULL DEFAULT false,
  "created_at" timestamp with time zone NOT NULL DEFAULT now(),
  "updated_at" timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT "academic_years_name_key" UNIQUE (name),
  CONSTRAINT "academic_years_pkey" PRIMARY KEY (id)
);

ALTER TABLE "public"."academic_years"
  ENABLE ROW LEVEL SECURITY;

CREATE TABLE "public"."admission_applications" (
  "id"                      uuid                     NOT NULL DEFAULT gen_random_uuid(),
  "application_number"      text                     NOT NULL,
  "student_name"            text                     NOT NULL,
  "gender"                  text                     NOT NULL,
  "date_of_birth"           date                     NOT NULL,
  "pen_number"              text,
  "social_category"         text                     NOT NULL,
  "nationality"             text                     NOT NULL,
  "blood_group"             text,
  "student_photo"           text,
  "mother_name"             text                     NOT NULL,
  "father_name"             text                     NOT NULL,
  "guardian_name"           text,
  "mobile_number"           text                     NOT NULL,
  "alternate_mobile_number" text,
  "email"                   text,
  "address"                 text                     NOT NULL,
  "pincode"                 text                     NOT NULL,
  "academic_year_id"        uuid                     NOT NULL,
  "class_id"                uuid                     NOT NULL,
  "preferred_section_id"    uuid,
  "previous_school_name"    text,
  "status"                  text                     NOT NULL DEFAULT 'Pending'::text,
  "rejection_reason"        text,
  "reviewed_at"             timestamp with time zone,
  "reviewed_by"             uuid,
  "created_at"              timestamp with time zone NOT NULL DEFAULT now(),
  "updated_at"              timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT "admission_applications_application_number_key" UNIQUE (application_number),
  CONSTRAINT "admission_applications_pkey" PRIMARY KEY (id),
  CONSTRAINT "admission_applications_status_check" CHECK ((status = ANY (ARRAY['Pending'::text, 'Approved'::text, 'Rejected'::text])))
);

ALTER TABLE "public"."admission_applications"
  ENABLE ROW LEVEL SECURITY;

CREATE TABLE "public"."classes" (
  "id"            uuid                     NOT NULL DEFAULT gen_random_uuid(),
  "name"          text                     NOT NULL,
  "display_order" integer                  NOT NULL,
  "created_at"    timestamp with time zone NOT NULL DEFAULT now(),
  "updated_at"    timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT "classes_display_order_key" UNIQUE (display_order),
  CONSTRAINT "classes_name_key" UNIQUE (name),
  CONSTRAINT "classes_pkey" PRIMARY KEY (id)
);

ALTER TABLE "public"."classes"
  ENABLE ROW LEVEL SECURITY;

CREATE TABLE "public"."profiles" (
  "id"         uuid                     NOT NULL,
  "full_name"  text                     NOT NULL,
  "role"       text                     NOT NULL DEFAULT 'staff'::text,
  "phone"      text,
  "is_active"  boolean                  NOT NULL DEFAULT true,
  "created_at" timestamp with time zone NOT NULL DEFAULT now(),
  "updated_at" timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT "profiles_pkey" PRIMARY KEY (id),
  CONSTRAINT "profiles_role_check" CHECK ((role = ANY (ARRAY['admin'::text, 'staff'::text])))
);

ALTER TABLE "public"."profiles"
  ENABLE ROW LEVEL SECURITY;

CREATE TABLE "public"."sections" (
  "id"         uuid                     NOT NULL DEFAULT gen_random_uuid(),
  "class_id"   uuid                     NOT NULL,
  "name"       text                     NOT NULL,
  "created_at" timestamp with time zone NOT NULL DEFAULT now(),
  "updated_at" timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT "sections_class_id_name_key" UNIQUE (class_id, name),
  CONSTRAINT "sections_pkey" PRIMARY KEY (id)
);

ALTER TABLE "public"."sections"
  ENABLE ROW LEVEL SECURITY;

CREATE TABLE "public"."student_enrollments" (
  "id"                   uuid                     NOT NULL DEFAULT gen_random_uuid(),
  "admission_number"     text                     NOT NULL,
  "academic_year_id"     uuid                     NOT NULL,
  "class_id"             uuid                     NOT NULL,
  "section_id"           uuid                     NOT NULL,
  "admission_date"       date                     NOT NULL DEFAULT CURRENT_DATE,
  "previous_school_name" text,
  "created_at"           timestamp with time zone NOT NULL DEFAULT now(),
  "updated_at"           timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT "student_enrollments_admission_number_academic_year_id_key" UNIQUE (admission_number, academic_year_id),
  CONSTRAINT "student_enrollments_pkey" PRIMARY KEY (id)
);

ALTER TABLE "public"."student_enrollments"
  ENABLE ROW LEVEL SECURITY;

CREATE TABLE "public"."students" (
  "admission_number"        text                     NOT NULL,
  "student_name"            text                     NOT NULL,
  "gender"                  text                     NOT NULL,
  "date_of_birth"           date                     NOT NULL,
  "pen_number"              text,
  "social_category"         text                     NOT NULL,
  "nationality"             text                     NOT NULL,
  "blood_group"             text,
  "student_photo"           text,
  "mother_name"             text                     NOT NULL,
  "father_name"             text                     NOT NULL,
  "guardian_name"           text,
  "mobile_number"           text                     NOT NULL,
  "alternate_mobile_number" text,
  "email"                   text,
  "address"                 text                     NOT NULL,
  "pincode"                 text                     NOT NULL,
  "student_status"          text                     NOT NULL DEFAULT 'Active'::text,
  "created_at"              timestamp with time zone NOT NULL DEFAULT now(),
  "updated_at"              timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT "students_pen_number_key" UNIQUE (pen_number),
  CONSTRAINT "students_pkey" PRIMARY KEY (admission_number)
);

ALTER TABLE "public"."students"
  ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.approve_admission_application (
  p_application_id   uuid,
  p_academic_year_id uuid,
  p_class_id         uuid,
  p_section_id       uuid
)
  RETURNS text
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path TO 'public'
  AS $function$DECLARE

    v_application admission_applications%ROWTYPE;

    v_admission_number text;

    v_section_class_id uuid;

BEGIN

    -------------------------------------------------
    -- CHECK AUTHORIZATION
    -------------------------------------------------

    IF NOT EXISTS (
        SELECT 1
        FROM public.profiles
        WHERE id = auth.uid()
        AND is_active = true
        AND role ='admin'
    ) THEN

        RAISE EXCEPTION 'You are not authorized to approve admissions.';

    END IF;


    -------------------------------------------------
    -- LOCK APPLICATION
    -------------------------------------------------

    SELECT *
    INTO v_application
    FROM public.admission_applications
    WHERE id = p_application_id
    FOR UPDATE;


    IF NOT FOUND THEN

        RAISE EXCEPTION 'Admission application not found.';

    END IF;


    -------------------------------------------------
    -- ONLY PENDING CAN BE APPROVED
    -------------------------------------------------

    IF v_application.status <> 'Pending' THEN

        RAISE EXCEPTION
        'Only pending applications can be approved.';

    END IF;


    -------------------------------------------------
    -- VALIDATE ACADEMIC YEAR
    -------------------------------------------------

    IF NOT EXISTS (
        SELECT 1
        FROM public.academic_years
        WHERE id = p_academic_year_id
    ) THEN

        RAISE EXCEPTION 'Invalid academic year.';

    END IF;


    -------------------------------------------------
    -- VALIDATE CLASS
    -------------------------------------------------

    IF NOT EXISTS (
        SELECT 1
        FROM public.classes
        WHERE id = p_class_id
    ) THEN

        RAISE EXCEPTION 'Invalid class.';

    END IF;


    -------------------------------------------------
    -- VALIDATE SECTION
    -------------------------------------------------

    SELECT class_id
    INTO v_section_class_id
    FROM public.sections
    WHERE id = p_section_id;


    IF v_section_class_id IS NULL THEN

        RAISE EXCEPTION 'Invalid section.';

    END IF;


    IF v_section_class_id <> p_class_id THEN

        RAISE EXCEPTION
        'Selected section does not belong to selected class.';

    END IF;


    -------------------------------------------------
    -- CREATE STUDENT
    -------------------------------------------------

    INSERT INTO public.students (

        student_name,
        gender,
        date_of_birth,
        pen_number,
        social_category,
        nationality,
        blood_group,
        student_photo,

        mother_name,
        father_name,
        guardian_name,

        mobile_number,
        alternate_mobile_number,
        email,
        address,
        pincode,

        student_status

    )

    VALUES (

        v_application.student_name,
        v_application.gender,
        v_application.date_of_birth,
        v_application.pen_number,
        v_application.social_category,
        v_application.nationality,
        v_application.blood_group,
        v_application.student_photo,

        v_application.mother_name,
        v_application.father_name,
        v_application.guardian_name,

        v_application.mobile_number,
        v_application.alternate_mobile_number,
        v_application.email,
        v_application.address,
        v_application.pincode,

        'Active'

    )

    RETURNING admission_number
    INTO v_admission_number;


    -------------------------------------------------
    -- CREATE ENROLLMENT
    -------------------------------------------------

    INSERT INTO public.student_enrollments (

        admission_number,
        academic_year_id,
        class_id,
        section_id,
        admission_date,
        previous_school_name

    )

    VALUES (

        v_admission_number,
        p_academic_year_id,
        p_class_id,
        p_section_id,
        CURRENT_DATE,
        v_application.previous_school_name

    );


    -------------------------------------------------
    -- UPDATE APPLICATION
    -------------------------------------------------

    UPDATE public.admission_applications

    SET

        academic_year_id = p_academic_year_id,
        class_id = p_class_id,
        preferred_section_id = p_section_id,

        status = 'Approved',

        reviewed_at = now(),

        reviewed_by = auth.uid(),

        rejection_reason = NULL

    WHERE id = p_application_id;


    -------------------------------------------------
    -- RETURN GENERATED ADM NUMBER
    -------------------------------------------------

    RETURN v_admission_number;

END;$function$;

CREATE OR REPLACE FUNCTION public.create_admin_student (
  p_application jsonb
)
  RETURNS text
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path TO 'public'
  AS $function$

DECLARE
    v_admission_number text;
    v_class_id uuid;
    v_section_id uuid;
    v_academic_year_id uuid;

BEGIN

    -- =====================================================
    -- ADMIN ONLY
    -- =====================================================

    IF public.get_my_role() <> 'admin' THEN

        RAISE EXCEPTION
            'Only administrators can create students directly.';

    END IF;


    -- =====================================================
    -- REQUIRED VALUES
    -- =====================================================

    IF nullif(
        trim(p_application->>'student_name'),
        ''
    ) IS NULL THEN

        RAISE EXCEPTION
            'Student name is required.';

    END IF;


    IF nullif(
        trim(p_application->>'gender'),
        ''
    ) IS NULL THEN

        RAISE EXCEPTION
            'Gender is required.';

    END IF;


    IF nullif(
        trim(p_application->>'date_of_birth'),
        ''
    ) IS NULL THEN

        RAISE EXCEPTION
            'Date of birth is required.';

    END IF;


    IF nullif(
        trim(p_application->>'social_category'),
        ''
    ) IS NULL THEN

        RAISE EXCEPTION
            'Social category is required.';

    END IF;


    IF nullif(
        trim(p_application->>'nationality'),
        ''
    ) IS NULL THEN

        RAISE EXCEPTION
            'Nationality is required.';

    END IF;


    IF nullif(
        trim(p_application->>'mother_name'),
        ''
    ) IS NULL THEN

        RAISE EXCEPTION
            'Mother name is required.';

    END IF;


    IF nullif(
        trim(p_application->>'father_name'),
        ''
    ) IS NULL THEN

        RAISE EXCEPTION
            'Father name is required.';

    END IF;


    IF nullif(
        trim(p_application->>'mobile_number'),
        ''
    ) IS NULL THEN

        RAISE EXCEPTION
            'Mobile number is required.';

    END IF;


    IF nullif(
        trim(p_application->>'address'),
        ''
    ) IS NULL THEN

        RAISE EXCEPTION
            'Address is required.';

    END IF;


    IF nullif(
        trim(p_application->>'pincode'),
        ''
    ) IS NULL THEN

        RAISE EXCEPTION
            'Pincode is required.';

    END IF;


    IF nullif(
        trim(p_application->>'academic_year_id'),
        ''
    ) IS NULL THEN

        RAISE EXCEPTION
            'Academic year is required.';

    END IF;


    IF nullif(
        trim(p_application->>'class_id'),
        ''
    ) IS NULL THEN

        RAISE EXCEPTION
            'Class is required.';

    END IF;


    IF nullif(
        trim(p_application->>'section_id'),
        ''
    ) IS NULL THEN

        RAISE EXCEPTION
            'Section is required.';

    END IF;


    -- =====================================================
    -- CONVERT IDS
    -- =====================================================

    v_academic_year_id :=
        (p_application->>'academic_year_id')::uuid;


    v_class_id :=
        (p_application->>'class_id')::uuid;


    v_section_id :=
        (p_application->>'section_id')::uuid;


    -- =====================================================
    -- VALIDATE CLASS
    -- =====================================================

    IF NOT EXISTS (

        SELECT 1
        FROM public.classes
        WHERE id = v_class_id

    ) THEN

        RAISE EXCEPTION
            'Selected class does not exist.';

    END IF;


    -- =====================================================
    -- VALIDATE SECTION
    -- =====================================================

    IF NOT EXISTS (

        SELECT 1
        FROM public.sections
        WHERE id = v_section_id
        AND class_id = v_class_id

    ) THEN

        RAISE EXCEPTION
            'Selected section does not belong to the selected class.';

    END IF;


    -- =====================================================
    -- VALIDATE ACADEMIC YEAR
    -- =====================================================

    IF NOT EXISTS (

        SELECT 1
        FROM public.academic_years
        WHERE id = v_academic_year_id

    ) THEN

        RAISE EXCEPTION
            'Selected academic year does not exist.';

    END IF;


    -- =====================================================
    -- CREATE STUDENT
    -- =====================================================

    INSERT INTO public.students (

        student_name,
        gender,
        date_of_birth,
        pen_number,
        social_category,
        nationality,
        blood_group,
        student_photo,

        mother_name,
        father_name,
        guardian_name,

        mobile_number,
        alternate_mobile_number,
        email,
        address,
        pincode,

        student_status

    )

    VALUES (

        trim(p_application->>'student_name'),

        trim(p_application->>'gender'),

        (p_application->>'date_of_birth')::date,

        nullif(
            trim(p_application->>'pen_number'),
            ''
        ),

        trim(p_application->>'social_category'),

        trim(p_application->>'nationality'),

        nullif(
            trim(p_application->>'blood_group'),
            ''
        ),

        nullif(
            trim(p_application->>'student_photo'),
            ''
        ),

        trim(p_application->>'mother_name'),

        trim(p_application->>'father_name'),

        nullif(
            trim(p_application->>'guardian_name'),
            ''
        ),

        trim(p_application->>'mobile_number'),

        nullif(
            trim(p_application->>'alternate_mobile_number'),
            ''
        ),

        nullif(
            trim(p_application->>'email'),
            ''
        ),

        trim(p_application->>'address'),

        trim(p_application->>'pincode'),

        'Active'

    )

    RETURNING admission_number
    INTO v_admission_number;


    -- =====================================================
    -- CREATE ENROLLMENT
    -- =====================================================

    INSERT INTO public.student_enrollments (

        admission_number,
        academic_year_id,
        class_id,
        section_id,
        admission_date,
        previous_school_name

    )

    VALUES (

        v_admission_number,

        v_academic_year_id,

        v_class_id,

        v_section_id,

        CURRENT_DATE,

        nullif(
            trim(
                p_application->>'previous_school_name'
            ),
            ''
        )

    );


    -- =====================================================
    -- RETURN GENERATED ADMISSION NUMBER
    -- =====================================================

    RETURN v_admission_number;

END;

$function$;

CREATE OR REPLACE FUNCTION public.generate_admission_number()
  RETURNS TRIGGER
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path TO 'public'
  AS $function$
BEGIN
    NEW.admission_number :=
        'ADM' ||
        LPAD(
            NEXTVAL('public.admission_number_seq')::TEXT,
            6,
            '0'
        );

    RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.generate_application_number()
  RETURNS TRIGGER
  LANGUAGE plpgsql
  AS $function$
begin

    NEW.application_number :=
        'APP' ||
        to_char(current_date, 'YYYY') ||
        lpad(
            nextval(
                'public.admission_application_number_seq'
            )::text,
            4,
            '0'
        );

    return NEW;

end;
$function$;

CREATE OR REPLACE FUNCTION public.get_my_role()
  RETURNS text
  LANGUAGE sql
  STABLE
  SECURITY DEFINER
  SET search_path TO 'public'
  AS $function$
    SELECT role
    FROM public.profiles
    WHERE id = auth.uid()
      AND is_active = TRUE
    LIMIT 1;
$function$;

CREATE OR REPLACE FUNCTION public.reject_admission_application (
  p_application_id uuid,
  p_reason         text DEFAULT NULL::text
)
  RETURNS text
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path TO 'public'
  AS $function$DECLARE

    v_status text;

BEGIN

    -------------------------------------------------
    -- CHECK AUTHORIZATION
    -------------------------------------------------

    IF NOT EXISTS (
        SELECT 1
        FROM public.profiles
        WHERE id = auth.uid()
        AND is_active = true
        AND role = 'admin'
    ) THEN

        RAISE EXCEPTION 'You are not authorized to reject admissions.';

    END IF;


    -------------------------------------------------
    -- LOCK APPLICATION
    -------------------------------------------------

    SELECT status
    INTO v_status
    FROM public.admission_applications
    WHERE id = p_application_id
    FOR UPDATE;


    IF NOT FOUND THEN

        RAISE EXCEPTION 'Admission application not found.';

    END IF;


    -------------------------------------------------
    -- ONLY PENDING
    -------------------------------------------------

    IF v_status <> 'Pending' THEN

        RAISE EXCEPTION
        'Only pending applications can be rejected.';

    END IF;


    -------------------------------------------------
    -- UPDATE
    -------------------------------------------------

    UPDATE public.admission_applications

    SET

        status = 'Rejected',

        rejection_reason =
            NULLIF(trim(p_reason), ''),

        reviewed_at = now(),

        reviewed_by = auth.uid()

    WHERE id = p_application_id;


    RETURN 'Rejected';

END;$function$;

CREATE OR REPLACE FUNCTION public.submit_admission_application (
  p_application jsonb
)
  RETURNS text
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path TO 'public'
  AS $function$
declare
    v_application_number text;
    v_class_id uuid;
    v_section_class_id uuid;
begin

    -- =========================================
    -- REQUIRED STUDENT INFORMATION
    -- =========================================

    if nullif(
        trim(p_application->>'student_name'),
        ''
    ) is null then

        raise exception 'Student name is required.';

    end if;


    if nullif(
        trim(p_application->>'gender'),
        ''
    ) is null then

        raise exception 'Gender is required.';

    end if;


    if nullif(
        trim(p_application->>'date_of_birth'),
        ''
    ) is null then

        raise exception 'Date of birth is required.';

    end if;


    if nullif(
        trim(p_application->>'social_category'),
        ''
    ) is null then

        raise exception 'Social category is required.';

    end if;


    if nullif(
        trim(p_application->>'nationality'),
        ''
    ) is null then

        raise exception 'Nationality is required.';

    end if;


    -- =========================================
    -- REQUIRED FAMILY INFORMATION
    -- =========================================

    if nullif(
        trim(p_application->>'mother_name'),
        ''
    ) is null then

        raise exception 'Mother name is required.';

    end if;


    if nullif(
        trim(p_application->>'father_name'),
        ''
    ) is null then

        raise exception 'Father name is required.';

    end if;


    -- =========================================
    -- REQUIRED CONTACT INFORMATION
    -- =========================================

    if nullif(
        trim(p_application->>'mobile_number'),
        ''
    ) is null then

        raise exception 'Mobile number is required.';

    end if;


    if nullif(
        trim(p_application->>'address'),
        ''
    ) is null then

        raise exception 'Address is required.';

    end if;


    if nullif(
        trim(p_application->>'pincode'),
        ''
    ) is null then

        raise exception 'Pincode is required.';

    end if;


    -- =========================================
    -- REQUIRED ENROLLMENT INFORMATION
    -- =========================================

    if nullif(
        trim(p_application->>'academic_year_id'),
        ''
    ) is null then

        raise exception 'Academic year is required.';

    end if;


    if nullif(
        trim(p_application->>'class_id'),
        ''
    ) is null then

        raise exception 'Class is required.';

    end if;


    -- =========================================
    -- VALIDATE CLASS
    -- =========================================

    v_class_id :=
        (p_application->>'class_id')::uuid;


    if not exists (
        select 1
        from public.classes
        where id = v_class_id
    ) then

        raise exception 'Selected class does not exist.';

    end if;


    -- =========================================
    -- VALIDATE PREFERRED SECTION
    -- =========================================

    if nullif(
        trim(p_application->>'preferred_section_id'),
        ''
    ) is not null then

        select class_id
        into v_section_class_id
        from public.sections
        where id =
            (p_application->>'preferred_section_id')::uuid;


        if v_section_class_id is null then

            raise exception
                'Selected section does not exist.';

        end if;


        if v_section_class_id <> v_class_id then

            raise exception
                'Selected section does not belong to the selected class.';

        end if;

    end if;


    -- =========================================
    -- INSERT APPLICATION
    -- =========================================

    insert into public.admission_applications (

        student_name,
        gender,
        date_of_birth,
        pen_number,
        social_category,
        nationality,
        blood_group,
        student_photo,

        mother_name,
        father_name,
        guardian_name,

        mobile_number,
        alternate_mobile_number,
        email,
        address,
        pincode,

        academic_year_id,
        class_id,
        preferred_section_id,
        previous_school_name

    )

    values (

        trim(p_application->>'student_name'),

        trim(p_application->>'gender'),

        (p_application->>'date_of_birth')::date,

        nullif(
            trim(p_application->>'pen_number'),
            ''
        ),

        trim(p_application->>'social_category'),

        trim(p_application->>'nationality'),

        nullif(
            trim(p_application->>'blood_group'),
            ''
        ),

        nullif(
            trim(p_application->>'student_photo'),
            ''
        ),


        trim(p_application->>'mother_name'),

        trim(p_application->>'father_name'),

        nullif(
            trim(p_application->>'guardian_name'),
            ''
        ),


        trim(p_application->>'mobile_number'),

        nullif(
            trim(p_application->>'alternate_mobile_number'),
            ''
        ),

        nullif(
            trim(p_application->>'email'),
            ''
        ),

        trim(p_application->>'address'),

        trim(p_application->>'pincode'),


        (p_application->>'academic_year_id')::uuid,

        (p_application->>'class_id')::uuid,

        case
            when nullif(
                trim(
                    p_application->>'preferred_section_id'
                ),
                ''
            ) is null
            then null

            else (
                p_application->>'preferred_section_id'
            )::uuid

        end,

        nullif(
            trim(
                p_application->>'previous_school_name'
            ),
            ''
        )

    )

    returning application_number
    into v_application_number;


    -- =========================================
    -- RETURN APPLICATION NUMBER
    -- =========================================

    return v_application_number;

end;
$function$;

CREATE OR REPLACE FUNCTION public.update_student (
  p_admission_number        text,
  p_student_name            text,
  p_gender                  text,
  p_date_of_birth           date,
  p_pen_number              text,
  p_social_category         text,
  p_nationality             text,
  p_blood_group             text,
  p_student_photo           text,
  p_mother_name             text,
  p_father_name             text,
  p_guardian_name           text,
  p_mobile_number           text,
  p_alternate_mobile_number text,
  p_email                   text,
  p_address                 text,
  p_pincode                 text,
  p_student_status          text
)
  RETURNS text
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path TO 'public'
  AS $function$
BEGIN

    -- =========================================
    -- ADMIN ONLY
    -- =========================================

    IF NOT EXISTS (
        SELECT 1
        FROM public.profiles
        WHERE id = auth.uid()
          AND is_active = true
          AND role = 'admin'
    ) THEN

        RAISE EXCEPTION
            'Only administrators can edit student information.';

    END IF;


    -- =========================================
    -- VALIDATE STUDENT
    -- =========================================

    IF NOT EXISTS (
        SELECT 1
        FROM public.students
        WHERE admission_number = p_admission_number
    ) THEN

        RAISE EXCEPTION
            'Student not found.';

    END IF;


    -- =========================================
    -- REQUIRED FIELDS
    -- =========================================

    IF NULLIF(
        trim(p_student_name),
        ''
    ) IS NULL THEN

        RAISE EXCEPTION
            'Student name is required.';

    END IF;


    IF NULLIF(
        trim(p_gender),
        ''
    ) IS NULL THEN

        RAISE EXCEPTION
            'Gender is required.';

    END IF;


    IF p_date_of_birth IS NULL THEN

        RAISE EXCEPTION
            'Date of birth is required.';

    END IF;


    IF NULLIF(
        trim(p_social_category),
        ''
    ) IS NULL THEN

        RAISE EXCEPTION
            'Social category is required.';

    END IF;


    IF NULLIF(
        trim(p_nationality),
        ''
    ) IS NULL THEN

        RAISE EXCEPTION
            'Nationality is required.';

    END IF;


    IF NULLIF(
        trim(p_mother_name),
        ''
    ) IS NULL THEN

        RAISE EXCEPTION
            'Mother name is required.';

    END IF;


    IF NULLIF(
        trim(p_father_name),
        ''
    ) IS NULL THEN

        RAISE EXCEPTION
            'Father name is required.';

    END IF;


    IF NULLIF(
        trim(p_mobile_number),
        ''
    ) IS NULL THEN

        RAISE EXCEPTION
            'Mobile number is required.';

    END IF;


    IF NULLIF(
        trim(p_address),
        ''
    ) IS NULL THEN

        RAISE EXCEPTION
            'Address is required.';

    END IF;


    IF NULLIF(
        trim(p_pincode),
        ''
    ) IS NULL THEN

        RAISE EXCEPTION
            'Pincode is required.';

    END IF;


    -- =========================================
    -- UPDATE STUDENT
    -- =========================================

    UPDATE public.students

    SET

        student_name =
            trim(p_student_name),

        gender =
            trim(p_gender),

        date_of_birth =
            p_date_of_birth,

        pen_number =
            NULLIF(
                trim(p_pen_number),
                ''
            ),

        social_category =
            trim(p_social_category),

        nationality =
            trim(p_nationality),

        blood_group =
            NULLIF(
                trim(p_blood_group),
                ''
            ),

        student_photo =
            NULLIF(
                trim(p_student_photo),
                ''
            ),

        mother_name =
            trim(p_mother_name),

        father_name =
            trim(p_father_name),

        guardian_name =
            NULLIF(
                trim(p_guardian_name),
                ''
            ),

        mobile_number =
            trim(p_mobile_number),

        alternate_mobile_number =
            NULLIF(
                trim(p_alternate_mobile_number),
                ''
            ),

        email =
            NULLIF(
                trim(p_email),
                ''
            ),

        address =
            trim(p_address),

        pincode =
            trim(p_pincode),

        student_status =
            trim(p_student_status)

    WHERE admission_number =
        p_admission_number;


    RETURN p_admission_number;

END;
$function$;

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
  RETURNS TRIGGER
  LANGUAGE plpgsql
  AS $function$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.update_user_profile (
  p_user_id   uuid,
  p_full_name text,
  p_phone     text,
  p_role      text,
  p_is_active boolean
)
  RETURNS text
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path TO 'public'
  AS $function$

DECLARE
    v_current_role text;
    v_target_role text;
    v_target_active boolean;
    v_active_admin_count integer;

BEGIN

    -- =============================================
    -- CHECK CURRENT USER
    -- =============================================

    v_current_role := public.get_my_role();

    IF v_current_role <> 'admin' THEN

        RAISE EXCEPTION
            'You are not authorized to update users.';

    END IF;


    -- =============================================
    -- VALIDATE INPUT
    -- =============================================

    IF p_user_id IS NULL THEN

        RAISE EXCEPTION
            'User ID is required.';

    END IF;


    IF NULLIF(trim(p_full_name), '') IS NULL THEN

        RAISE EXCEPTION
            'Full name is required.';

    END IF;


    IF p_role NOT IN ('admin', 'staff') THEN

        RAISE EXCEPTION
            'Invalid role.';

    END IF;


    -- =============================================
    -- GET CURRENT TARGET USER
    -- =============================================

    SELECT
        role,
        is_active
    INTO
        v_target_role,
        v_target_active
    FROM public.profiles
    WHERE id = p_user_id
    FOR UPDATE;


    IF NOT FOUND THEN

        RAISE EXCEPTION
            'User not found.';

    END IF;


    -- =============================================
    -- PREVENT LAST ACTIVE ADMIN FROM
    -- BEING REMOVED
    -- =============================================

    IF
        v_target_role = 'admin'
        AND v_target_active = true
        AND (
            p_role <> 'admin'
            OR p_is_active = false
        )
    THEN

        SELECT count(*)
        INTO v_active_admin_count
        FROM public.profiles
        WHERE role = 'admin'
        AND is_active = true;


        IF v_active_admin_count <= 1 THEN

            RAISE EXCEPTION
                'The last active Admin cannot be deactivated or changed to Staff.';

        END IF;

    END IF;


    -- =============================================
    -- UPDATE PROFILE
    -- =============================================

    UPDATE public.profiles

    SET
        full_name = trim(p_full_name),

        phone =
            NULLIF(
                trim(p_phone),
                ''
            ),

        role = p_role,

        is_active = p_is_active,

        updated_at = now()

    WHERE id = p_user_id;


    RETURN 'User updated successfully.';

END;

$function$;

ALTER TABLE "public"."academic_records"
  ADD CONSTRAINT "academic_records_academic_year_id_fkey" FOREIGN KEY (academic_year_id) REFERENCES public.academic_years(id) ON DELETE RESTRICT;

ALTER TABLE "public"."admission_applications"
  ADD CONSTRAINT "admission_applications_academic_year_id_fkey" FOREIGN KEY (academic_year_id) REFERENCES public.academic_years(id) ON DELETE RESTRICT;

ALTER TABLE "public"."admission_applications"
  ADD CONSTRAINT "admission_applications_class_id_fkey" FOREIGN KEY (class_id) REFERENCES public.classes(id) ON DELETE RESTRICT;

ALTER TABLE "public"."profiles"
  ADD CONSTRAINT "profiles_id_fkey" FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE;

ALTER TABLE "public"."admission_applications"
  ADD CONSTRAINT "admission_applications_reviewed_by_fkey" FOREIGN KEY (reviewed_by) REFERENCES public.profiles(id) ON DELETE RESTRICT;

ALTER TABLE "public"."sections"
  ADD CONSTRAINT "sections_class_id_fkey" FOREIGN KEY (class_id) REFERENCES public.classes(id) ON DELETE CASCADE;

ALTER TABLE "public"."admission_applications"
  ADD CONSTRAINT "admission_applications_preferred_section_id_fkey" FOREIGN KEY (preferred_section_id) REFERENCES public.sections(id) ON DELETE RESTRICT;

ALTER TABLE "public"."student_enrollments"
  ADD CONSTRAINT "student_enrollments_academic_year_id_fkey" FOREIGN KEY (academic_year_id) REFERENCES public.academic_years(id) ON DELETE RESTRICT;

ALTER TABLE "public"."student_enrollments"
  ADD CONSTRAINT "student_enrollments_class_id_fkey" FOREIGN KEY (class_id) REFERENCES public.classes(id) ON DELETE RESTRICT;

ALTER TABLE "public"."student_enrollments"
  ADD CONSTRAINT "student_enrollments_section_id_fkey" FOREIGN KEY (section_id) REFERENCES public.sections(id) ON DELETE RESTRICT;

ALTER TABLE "public"."academic_records"
  ADD CONSTRAINT "academic_records_admission_number_fkey" FOREIGN KEY (admission_number) REFERENCES public.students(admission_number) ON DELETE RESTRICT;

ALTER TABLE "public"."student_enrollments"
  ADD CONSTRAINT "student_enrollments_admission_number_fkey" FOREIGN KEY (admission_number) REFERENCES public.students(admission_number) ON DELETE RESTRICT;

CREATE TRIGGER academic_records_updated_at_trigger
  BEFORE UPDATE ON public.academic_records
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER academic_years_updated_at_trigger
  BEFORE UPDATE ON public.academic_years
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER admission_applications_number_trigger
  BEFORE INSERT ON public.admission_applications
  FOR EACH ROW
  WHEN (((new.application_number IS NULL) OR (new.application_number = ''::text)))
  EXECUTE FUNCTION public.generate_application_number();

CREATE TRIGGER admission_applications_updated_at_trigger
  BEFORE UPDATE ON public.admission_applications
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER classes_updated_at_trigger
  BEFORE UPDATE ON public.classes
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER sections_updated_at_trigger
  BEFORE UPDATE ON public.sections
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER student_enrollments_updated_at_trigger
  BEFORE UPDATE ON public.student_enrollments
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER students_admission_number_trigger
  BEFORE INSERT ON public.students
  FOR EACH ROW
  EXECUTE FUNCTION public.generate_admission_number();

CREATE TRIGGER students_updated_at_trigger
  BEFORE UPDATE ON public.students
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE POLICY "Admins can manage academic records" ON "public"."academic_records"
  FOR ALL
  TO "authenticated"
  USING ((public.get_my_role() = 'admin'::text))
  WITH CHECK ((public.get_my_role() = 'admin'::text));

CREATE POLICY "Staff can view academic records" ON "public"."academic_records"
  FOR SELECT
  TO "authenticated"
  USING ((public.get_my_role() = ANY (ARRAY['admin'::text, 'staff'::text])));

CREATE POLICY "Admins can manage academic years" ON "public"."academic_years"
  FOR ALL
  TO "authenticated"
  USING ((public.get_my_role() = 'admin'::text))
  WITH CHECK ((public.get_my_role() = 'admin'::text));

CREATE POLICY "Public can view academic years" ON "public"."academic_years"
  FOR SELECT
  TO "anon"
  USING (true);

CREATE POLICY "Staff can view academic years" ON "public"."academic_years"
  FOR SELECT
  TO "authenticated"
  USING ((public.get_my_role() = ANY (ARRAY['admin'::text, 'staff'::text])));

CREATE POLICY "Authenticated staff can view admission applications" ON "public"."admission_applications"
  FOR SELECT
  TO "authenticated"
  USING ((EXISTS ( SELECT 1
   FROM public.profiles
  WHERE ((profiles.id = auth.uid()) AND (profiles.is_active = true) AND (profiles.role = ANY (ARRAY['admin'::text, 'staff'::text]))))));

CREATE POLICY "Admins can manage classes" ON "public"."classes"
  FOR ALL
  TO "authenticated"
  USING ((public.get_my_role() = 'admin'::text))
  WITH CHECK ((public.get_my_role() = 'admin'::text));

CREATE POLICY "Public can view classes" ON "public"."classes"
  FOR SELECT
  TO "anon"
  USING (true);

CREATE POLICY "Staff can view classes" ON "public"."classes"
  FOR SELECT
  TO "authenticated"
  USING ((public.get_my_role() = ANY (ARRAY['admin'::text, 'staff'::text])));

CREATE POLICY "Admins can delete profiles" ON "public"."profiles"
  FOR DELETE
  TO "authenticated"
  USING ((public.get_my_role() = 'admin'::text));

CREATE POLICY "Admins can insert profiles" ON "public"."profiles"
  FOR INSERT
  TO "authenticated"
  WITH CHECK ((public.get_my_role() = 'admin'::text));

CREATE POLICY "Admins can update profiles" ON "public"."profiles"
  FOR UPDATE
  TO "authenticated"
  USING ((public.get_my_role() = 'admin'::text))
  WITH CHECK ((public.get_my_role() = 'admin'::text));

CREATE POLICY "Admins can view all profiles" ON "public"."profiles"
  FOR SELECT
  TO "authenticated"
  USING ((public.get_my_role() = ANY (ARRAY['admin'::text, 'staff'::text])));

CREATE POLICY "Admins can manage sections" ON "public"."sections"
  FOR ALL
  TO "authenticated"
  USING ((public.get_my_role() = 'admin'::text))
  WITH CHECK ((public.get_my_role() = 'admin'::text));

CREATE POLICY "Public can view sections" ON "public"."sections"
  FOR SELECT
  TO "anon"
  USING (true);

CREATE POLICY "Staff can view sections" ON "public"."sections"
  FOR SELECT
  TO "authenticated"
  USING ((public.get_my_role() = ANY (ARRAY['admin'::text, 'staff'::text])));

CREATE POLICY "Admins can manage enrollments" ON "public"."student_enrollments"
  FOR ALL
  TO "authenticated"
  USING ((public.get_my_role() = 'admin'::text))
  WITH CHECK ((public.get_my_role() = 'admin'::text));

CREATE POLICY "Staff can view enrollments" ON "public"."student_enrollments"
  FOR SELECT
  TO "authenticated"
  USING ((public.get_my_role() = ANY (ARRAY['admin'::text, 'staff'::text])));

CREATE POLICY "Admins can manage students" ON "public"."students"
  FOR ALL
  TO "authenticated"
  USING ((public.get_my_role() = 'admin'::text))
  WITH CHECK ((public.get_my_role() = 'admin'::text));

CREATE POLICY "Staff can view students" ON "public"."students"
  FOR SELECT
  TO "authenticated"
  USING ((public.get_my_role() = ANY (ARRAY['admin'::text, 'staff'::text])));

GRANT EXECUTE ON FUNCTION "public"."approve_admission_application"(uuid, uuid, uuid, uuid) TO PUBLIC, "anon", "authenticated", "postgres", "service_role";

GRANT EXECUTE ON FUNCTION "public"."create_admin_student"(jsonb) TO PUBLIC, "anon", "authenticated", "postgres", "service_role";

GRANT EXECUTE ON FUNCTION "public"."generate_admission_number"() TO PUBLIC, "anon", "authenticated", "postgres", "service_role";

GRANT EXECUTE ON FUNCTION "public"."generate_application_number"() TO PUBLIC, "anon", "authenticated", "postgres", "service_role";

REVOKE ALL ON FUNCTION "public"."get_my_role"() FROM PUBLIC;

GRANT EXECUTE ON FUNCTION "public"."get_my_role"() TO "anon", "authenticated", "postgres", "service_role";

GRANT EXECUTE ON FUNCTION "public"."reject_admission_application"(uuid, text) TO PUBLIC, "anon", "authenticated", "postgres", "service_role";

GRANT EXECUTE ON FUNCTION "public"."submit_admission_application"(jsonb) TO PUBLIC, "anon", "authenticated", "postgres", "service_role";

GRANT EXECUTE
  ON FUNCTION "public"."update_student"(text, text, text, date, text, text, text, text, text, text, text, text, text, text, text, text, text, text)
  TO PUBLIC, "anon", "authenticated", "postgres", "service_role";

GRANT EXECUTE ON FUNCTION "public"."update_updated_at_column"() TO PUBLIC, "anon", "authenticated", "postgres", "service_role";

GRANT EXECUTE ON FUNCTION "public"."update_user_profile"(uuid, text, text, text, boolean) TO PUBLIC, "anon", "authenticated", "postgres", "service_role";

GRANT SELECT, UPDATE, USAGE ON SEQUENCE "public"."admission_application_number_seq" TO "anon", "authenticated", "postgres", "service_role";

GRANT SELECT, UPDATE, USAGE ON SEQUENCE "public"."admission_number_seq" TO "anon", "authenticated", "postgres", "service_role";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."academic_records" TO "anon", "authenticated", "postgres", "service_role";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."academic_years" TO "anon", "authenticated", "postgres", "service_role";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."admission_applications" TO "anon", "authenticated", "postgres", "service_role";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."classes" TO "anon", "authenticated", "postgres", "service_role";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."profiles" TO "anon", "authenticated", "postgres", "service_role";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."sections" TO "anon", "authenticated", "postgres", "service_role";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."student_enrollments" TO "anon", "authenticated", "postgres", "service_role";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."students" TO "anon", "authenticated", "postgres", "service_role";

