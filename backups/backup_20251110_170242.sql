--
-- PostgreSQL database dump
--

\restrict MtEhXgd8WsOL1ad5xODrS42fwsSsmsLH3DvJiTvJQqUTzbvM5y9rhv1bFObOHuQ

-- Dumped from database version 18.0 (Debian 18.0-1.pgdg13+3)
-- Dumped by pg_dump version 18.0 (Debian 18.0-1.pgdg13+3)

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: pgcrypto; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA public;


--
-- Name: EXTENSION pgcrypto; Type: COMMENT; Schema: -; Owner: 
--

COMMENT ON EXTENSION pgcrypto IS 'cryptographic functions';


--
-- Name: cleanup_inactive_users(); Type: PROCEDURE; Schema: public; Owner: postgres
--

CREATE PROCEDURE public.cleanup_inactive_users()
    LANGUAGE plpgsql
    AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    WITH deleted AS (
        DELETE FROM Users
        WHERE id NOT IN (SELECT user_id FROM Orders WHERE user_id IS NOT NULL)
          AND id NOT IN (SELECT user_id FROM UserRoles WHERE user_id IS NOT NULL)
        RETURNING id
    )
    SELECT COUNT(*) INTO deleted_count FROM deleted;

    RAISE NOTICE 'Deleted % inactive users', deleted_count;
END;
$$;


ALTER PROCEDURE public.cleanup_inactive_users() OWNER TO postgres;

--
-- Name: create_order_with_items(integer, jsonb); Type: PROCEDURE; Schema: public; Owner: postgres
--

CREATE PROCEDURE public.create_order_with_items(IN p_user_id integer, IN p_items jsonb)
    LANGUAGE plpgsql
    AS $$
DECLARE
    item JSONB;
    total DECIMAL(10,2) := 0;
    order_id INTEGER;
    item_price DECIMAL(10,2);
BEGIN
    INSERT INTO Orders (user_id, total_price, status)
    VALUES (p_user_id, 0, 'pending')
    RETURNING id INTO order_id;

    FOR item IN SELECT * FROM jsonb_array_elements(p_items)
    LOOP
        IF (item->>'type') = 'account' THEN
            SELECT price INTO item_price FROM Accounts WHERE id = (item->>'id')::INTEGER AND status = 'available';
            IF item_price IS NULL THEN
                RAISE EXCEPTION 'Account % not available', (item->>'id');
            END IF;
            UPDATE Accounts SET status = 'sold' WHERE id = (item->>'id')::INTEGER;
        ELSIF (item->>'type') = 'key' THEN
            SELECT price INTO item_price FROM Keys WHERE id = (item->>'id')::INTEGER AND status = 'available';
            IF item_price IS NULL THEN
                RAISE EXCEPTION 'Key % not available', (item->>'id');
            END IF;
            UPDATE Keys SET status = 'sold' WHERE id = (item->>'id')::INTEGER;
        END IF;

        total := total + item_price * (item->>'qty')::INTEGER;

        INSERT INTO OrderItems (order_id, item_type, item_id, quantity)
        VALUES (order_id, item->>'type', (item->>'id')::INTEGER, (item->>'qty')::INTEGER);
    END LOOP;

    UPDATE Orders SET total_price = total, status = 'completed' WHERE id = order_id;

    RAISE NOTICE 'Order % created with total %.2f', order_id, total;
EXCEPTION
    WHEN OTHERS THEN
        ROLLBACK;
        RAISE;
END;
$$;


ALTER PROCEDURE public.create_order_with_items(IN p_user_id integer, IN p_items jsonb) OWNER TO postgres;

--
-- Name: decrypt_field(text); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.decrypt_field(encrypted_text text) RETURNS text
    LANGUAGE plpgsql
    AS $$
BEGIN
    RETURN pgp_sym_decrypt(decode(encrypted_text, 'base64'), current_setting('app.encryption_key'));
EXCEPTION
    WHEN OTHERS THEN RETURN '***ENCRYPTED***';
END;
$$;


ALTER FUNCTION public.decrypt_field(encrypted_text text) OWNER TO postgres;

--
-- Name: encrypt_field(text); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.encrypt_field(plain_text text) RETURNS text
    LANGUAGE plpgsql
    AS $$
BEGIN
    RETURN encode(pgp_sym_encrypt(plain_text, current_setting('app.encryption_key')), 'base64');
END;
$$;


ALTER FUNCTION public.encrypt_field(plain_text text) OWNER TO postgres;

--
-- Name: get_revenue_by_platform(integer); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.get_revenue_by_platform(p_platform_id integer) RETURNS numeric
    LANGUAGE plpgsql
    AS $$
DECLARE
    revenue DECIMAL(10,2);
BEGIN
    SELECT SUM(oi.quantity * 
        CASE WHEN oi.item_type = 'account' THEN a.price ELSE k.price END
    ) INTO revenue
    FROM OrderItems oi
    JOIN Orders o ON oi.order_id = o.id
    LEFT JOIN Accounts a ON oi.item_type = 'account' AND oi.item_id = a.id
    LEFT JOIN Keys k ON oi.item_type = 'key' AND oi.item_id = k.id
    JOIN Games g ON (a.game_id = g.id OR k.game_id = g.id)
    WHERE g.platform_id = p_platform_id AND o.status = 'completed';

    RETURN COALESCE(revenue, 0);
END;
$$;


ALTER FUNCTION public.get_revenue_by_platform(p_platform_id integer) OWNER TO postgres;

--
-- Name: get_user_role(integer); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.get_user_role(p_user_id integer) RETURNS text
    LANGUAGE plpgsql
    AS $$
DECLARE
    role_name TEXT;
BEGIN
    SELECT r.name INTO role_name
    FROM UserRoles ur
    JOIN Roles r ON ur.role_id = r.id
    WHERE ur.user_id = p_user_id
    LIMIT 1;

    RETURN COALESCE(role_name, 'guest');
END;
$$;


ALTER FUNCTION public.get_user_role(p_user_id integer) OWNER TO postgres;

--
-- Name: increase_prices_by_percent(numeric); Type: PROCEDURE; Schema: public; Owner: postgres
--

CREATE PROCEDURE public.increase_prices_by_percent(IN p_percent numeric)
    LANGUAGE plpgsql
    AS $$
BEGIN
    UPDATE Accounts SET price = price * (1 + p_percent / 100) WHERE status = 'available';
    UPDATE Keys SET price = price * (1 + p_percent / 100) WHERE status = 'available';
    RAISE NOTICE 'Prices increased by %%%', p_percent;
END;
$$;


ALTER PROCEDURE public.increase_prices_by_percent(IN p_percent numeric) OWNER TO postgres;

--
-- Name: is_item_available(text, integer); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.is_item_available(p_type text, p_id integer) RETURNS boolean
    LANGUAGE plpgsql
    AS $$
BEGIN
    IF p_type = 'account' THEN
        RETURN EXISTS (SELECT 1 FROM Accounts WHERE id = p_id AND status = 'available');
    ELSIF p_type = 'key' THEN
        RETURN EXISTS (SELECT 1 FROM Keys WHERE id = p_id AND status = 'available');
    ELSE
        RETURN FALSE;
    END IF;
END;
$$;


ALTER FUNCTION public.is_item_available(p_type text, p_id integer) OWNER TO postgres;

--
-- Name: log_audit(integer, text, name, jsonb, jsonb); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.log_audit(p_user_id integer, p_action text, p_table name, p_old jsonb DEFAULT NULL::jsonb, p_new jsonb DEFAULT NULL::jsonb) RETURNS void
    LANGUAGE plpgsql
    AS $$
BEGIN
    INSERT INTO AuditLog (user_id, action, table_name, old_value, new_value)
    VALUES (p_user_id, p_action, p_table, p_old::TEXT, p_new::TEXT);
END;
$$;


ALTER FUNCTION public.log_audit(p_user_id integer, p_action text, p_table name, p_old jsonb, p_new jsonb) OWNER TO postgres;

--
-- Name: prevent_sold_item_delete(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.prevent_sold_item_delete() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    IF OLD.status = 'sold' THEN
        RAISE EXCEPTION 'Cannot delete sold item (id=%)', OLD.id;
    END IF;
    RETURN OLD;
END;
$$;


ALTER FUNCTION public.prevent_sold_item_delete() OWNER TO postgres;

--
-- Name: trigger_audit_accounts(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.trigger_audit_accounts() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    IF TG_OP = 'UPDATE' THEN
        PERFORM log_audit(
            NULL::INTEGER,
            TG_OP::TEXT,           -- Приведение к TEXT
            TG_TABLE_NAME,         -- TYPE NAME
            to_jsonb(OLD),
            to_jsonb(NEW)
        );
    ELSIF TG_OP = 'DELETE' THEN
        PERFORM log_audit(
            NULL::INTEGER,
            TG_OP::TEXT,
            TG_TABLE_NAME,
            to_jsonb(OLD),
            NULL
        );
    END IF;
    RETURN NEW;
END;
$$;


ALTER FUNCTION public.trigger_audit_accounts() OWNER TO postgres;

--
-- Name: update_order_total(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.update_order_total() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
DECLARE
    total DECIMAL(10,2);
    order_id_val INTEGER;
BEGIN
    order_id_val := COALESCE(NEW.order_id, OLD.order_id);

    SELECT SUM(oi.quantity * 
        CASE WHEN oi.item_type = 'account' THEN a.price ELSE k.price END
    ) INTO total
    FROM OrderItems oi
    LEFT JOIN Accounts a ON oi.item_type = 'account' AND oi.item_id = a.id
    LEFT JOIN Keys k ON oi.item_type = 'key' AND oi.item_id = k.id
    WHERE oi.order_id = order_id_val;

    UPDATE Orders 
    SET total_price = COALESCE(total, 0) 
    WHERE id = order_id_val;

    RETURN COALESCE(NEW, OLD);
END;
$$;


ALTER FUNCTION public.update_order_total() OWNER TO postgres;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: accounts; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.accounts (
    id integer NOT NULL,
    game_id integer NOT NULL,
    login character varying(100) NOT NULL,
    password_encrypted character varying(255) NOT NULL,
    price numeric(10,2) NOT NULL,
    status character varying(20) DEFAULT 'available'::character varying NOT NULL,
    CONSTRAINT accounts_price_check CHECK ((price > (0)::numeric)),
    CONSTRAINT accounts_status_check CHECK (((status)::text = ANY ((ARRAY['available'::character varying, 'sold'::character varying])::text[])))
);


ALTER TABLE public.accounts OWNER TO postgres;

--
-- Name: accounts_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.accounts_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.accounts_id_seq OWNER TO postgres;

--
-- Name: accounts_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.accounts_id_seq OWNED BY public.accounts.id;


--
-- Name: auditlog; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.auditlog (
    id integer NOT NULL,
    user_id integer,
    action character varying(50) NOT NULL,
    table_name character varying(50) NOT NULL,
    old_value text,
    new_value text,
    "timestamp" timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.auditlog OWNER TO postgres;

--
-- Name: auditlog_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.auditlog_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.auditlog_id_seq OWNER TO postgres;

--
-- Name: auditlog_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.auditlog_id_seq OWNED BY public.auditlog.id;


--
-- Name: games; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.games (
    id integer NOT NULL,
    title character varying(100) NOT NULL,
    platform_id integer NOT NULL,
    description text,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.games OWNER TO postgres;

--
-- Name: games_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.games_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.games_id_seq OWNER TO postgres;

--
-- Name: games_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.games_id_seq OWNED BY public.games.id;


--
-- Name: keys; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.keys (
    id integer NOT NULL,
    game_id integer NOT NULL,
    key_code_encrypted character varying(255) NOT NULL,
    price numeric(10,2) NOT NULL,
    status character varying(20) DEFAULT 'available'::character varying NOT NULL,
    CONSTRAINT keys_price_check CHECK ((price > (0)::numeric)),
    CONSTRAINT keys_status_check CHECK (((status)::text = ANY ((ARRAY['available'::character varying, 'sold'::character varying])::text[])))
);


ALTER TABLE public.keys OWNER TO postgres;

--
-- Name: keys_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.keys_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.keys_id_seq OWNER TO postgres;

--
-- Name: keys_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.keys_id_seq OWNED BY public.keys.id;


--
-- Name: orderitems; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.orderitems (
    id integer NOT NULL,
    order_id integer NOT NULL,
    item_type character varying(20) NOT NULL,
    item_id integer NOT NULL,
    quantity integer DEFAULT 1 NOT NULL,
    CONSTRAINT orderitems_item_type_check CHECK (((item_type)::text = ANY ((ARRAY['account'::character varying, 'key'::character varying])::text[]))),
    CONSTRAINT orderitems_quantity_check CHECK ((quantity > 0))
);


ALTER TABLE public.orderitems OWNER TO postgres;

--
-- Name: orderitems_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.orderitems_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.orderitems_id_seq OWNER TO postgres;

--
-- Name: orderitems_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.orderitems_id_seq OWNED BY public.orderitems.id;


--
-- Name: orders; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.orders (
    id integer NOT NULL,
    user_id integer NOT NULL,
    total_price numeric(10,2) NOT NULL,
    status character varying(20) DEFAULT 'pending'::character varying NOT NULL,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT orders_status_check CHECK (((status)::text = ANY ((ARRAY['pending'::character varying, 'completed'::character varying, 'cancelled'::character varying])::text[]))),
    CONSTRAINT orders_total_price_check CHECK ((total_price >= (0)::numeric))
);


ALTER TABLE public.orders OWNER TO postgres;

--
-- Name: orders_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.orders_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.orders_id_seq OWNER TO postgres;

--
-- Name: orders_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.orders_id_seq OWNED BY public.orders.id;


--
-- Name: payments; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.payments (
    id integer NOT NULL,
    order_id integer NOT NULL,
    amount numeric(10,2) NOT NULL,
    method character varying(20) NOT NULL,
    status character varying(20) NOT NULL,
    CONSTRAINT payments_amount_check CHECK ((amount > (0)::numeric)),
    CONSTRAINT payments_method_check CHECK (((method)::text = ANY ((ARRAY['card'::character varying, 'paypal'::character varying])::text[]))),
    CONSTRAINT payments_status_check CHECK (((status)::text = ANY ((ARRAY['success'::character varying, 'failed'::character varying])::text[])))
);


ALTER TABLE public.payments OWNER TO postgres;

--
-- Name: payments_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.payments_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.payments_id_seq OWNER TO postgres;

--
-- Name: payments_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.payments_id_seq OWNED BY public.payments.id;


--
-- Name: platforms; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.platforms (
    id integer NOT NULL,
    name character varying(50) NOT NULL,
    description text,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.platforms OWNER TO postgres;

--
-- Name: platforms_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.platforms_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.platforms_id_seq OWNER TO postgres;

--
-- Name: platforms_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.platforms_id_seq OWNED BY public.platforms.id;


--
-- Name: roles; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.roles (
    id integer NOT NULL,
    name character varying(50) NOT NULL,
    description text,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.roles OWNER TO postgres;

--
-- Name: roles_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.roles_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.roles_id_seq OWNER TO postgres;

--
-- Name: roles_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.roles_id_seq OWNED BY public.roles.id;


--
-- Name: userroles; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.userroles (
    id integer NOT NULL,
    user_id integer NOT NULL,
    role_id integer NOT NULL,
    assigned_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.userroles OWNER TO postgres;

--
-- Name: userroles_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.userroles_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.userroles_id_seq OWNER TO postgres;

--
-- Name: userroles_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.userroles_id_seq OWNED BY public.userroles.id;


--
-- Name: users; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.users (
    id integer NOT NULL,
    username character varying(50) NOT NULL,
    email character varying(100) NOT NULL,
    password_hash character varying(255) NOT NULL,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT users_email_check CHECK (((email)::text ~* '^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$'::text))
);


ALTER TABLE public.users OWNER TO postgres;

--
-- Name: users_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.users_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.users_id_seq OWNER TO postgres;

--
-- Name: users_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.users_id_seq OWNED BY public.users.id;


--
-- Name: usersettings; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.usersettings (
    id integer NOT NULL,
    user_id integer NOT NULL,
    theme character varying(20) DEFAULT 'light'::character varying,
    date_format character varying(20) DEFAULT 'YYYY-MM-DD'::character varying,
    page_size integer DEFAULT 10,
    CONSTRAINT usersettings_page_size_check CHECK ((page_size > 0)),
    CONSTRAINT usersettings_theme_check CHECK (((theme)::text = ANY ((ARRAY['light'::character varying, 'dark'::character varying])::text[])))
);


ALTER TABLE public.usersettings OWNER TO postgres;

--
-- Name: usersettings_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.usersettings_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.usersettings_id_seq OWNER TO postgres;

--
-- Name: usersettings_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.usersettings_id_seq OWNED BY public.usersettings.id;


--
-- Name: v_active_users; Type: VIEW; Schema: public; Owner: postgres
--

CREATE VIEW public.v_active_users AS
SELECT
    NULL::integer AS id,
    NULL::character varying(50) AS username,
    NULL::character varying(100) AS email,
    NULL::bigint AS orders_count,
    NULL::numeric AS total_spent,
    NULL::timestamp without time zone AS last_order;


ALTER VIEW public.v_active_users OWNER TO postgres;

--
-- Name: v_available_inventory; Type: VIEW; Schema: public; Owner: postgres
--

CREATE VIEW public.v_available_inventory AS
 SELECT 'account'::text AS item_type,
    a.id,
    g.title,
    p.name AS platform,
    a.login,
    a.price
   FROM ((public.accounts a
     JOIN public.games g ON ((a.game_id = g.id)))
     JOIN public.platforms p ON ((g.platform_id = p.id)))
  WHERE ((a.status)::text = 'available'::text)
UNION ALL
 SELECT 'key'::text AS item_type,
    k.id,
    g.title,
    p.name AS platform,
    k.key_code_encrypted AS login,
    k.price
   FROM ((public.keys k
     JOIN public.games g ON ((k.game_id = g.id)))
     JOIN public.platforms p ON ((g.platform_id = p.id)))
  WHERE ((k.status)::text = 'available'::text)
  ORDER BY 4, 3;


ALTER VIEW public.v_available_inventory OWNER TO postgres;

--
-- Name: v_game_sales; Type: VIEW; Schema: public; Owner: postgres
--

CREATE VIEW public.v_game_sales AS
 SELECT p.name AS platform,
    g.title AS game,
    (count(DISTINCT a.id) + count(DISTINCT k.id)) AS total_items,
    sum(((oi.quantity)::numeric * COALESCE(a.price, k.price))) AS revenue
   FROM ((((public.platforms p
     JOIN public.games g ON ((g.platform_id = p.id)))
     LEFT JOIN public.accounts a ON (((a.game_id = g.id) AND ((a.status)::text = 'sold'::text))))
     LEFT JOIN public.keys k ON (((k.game_id = g.id) AND ((k.status)::text = 'sold'::text))))
     LEFT JOIN public.orderitems oi ON (((((oi.item_type)::text = 'account'::text) AND (oi.item_id = a.id)) OR (((oi.item_type)::text = 'key'::text) AND (oi.item_id = k.id)))))
  GROUP BY p.name, g.title
  ORDER BY (sum(((oi.quantity)::numeric * COALESCE(a.price, k.price)))) DESC;


ALTER VIEW public.v_game_sales OWNER TO postgres;

--
-- Name: v_sales_report; Type: VIEW; Schema: public; Owner: postgres
--

CREATE VIEW public.v_sales_report AS
 SELECT p.name AS platform,
    g.title AS game,
    count(oi.id) AS items_sold,
    sum(((oi.quantity)::numeric *
        CASE
            WHEN ((oi.item_type)::text = 'account'::text) THEN a.price
            ELSE k.price
        END)) AS revenue
   FROM ((((public.platforms p
     JOIN public.games g ON ((g.platform_id = p.id)))
     LEFT JOIN public.accounts a ON (((a.game_id = g.id) AND ((a.status)::text = 'sold'::text))))
     LEFT JOIN public.keys k ON (((k.game_id = g.id) AND ((k.status)::text = 'sold'::text))))
     LEFT JOIN public.orderitems oi ON (((((oi.item_type)::text = 'account'::text) AND (oi.item_id = a.id)) OR (((oi.item_type)::text = 'key'::text) AND (oi.item_id = k.id)))))
  GROUP BY p.name, g.title;


ALTER VIEW public.v_sales_report OWNER TO postgres;

--
-- Name: accounts id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.accounts ALTER COLUMN id SET DEFAULT nextval('public.accounts_id_seq'::regclass);


--
-- Name: auditlog id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.auditlog ALTER COLUMN id SET DEFAULT nextval('public.auditlog_id_seq'::regclass);


--
-- Name: games id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.games ALTER COLUMN id SET DEFAULT nextval('public.games_id_seq'::regclass);


--
-- Name: keys id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.keys ALTER COLUMN id SET DEFAULT nextval('public.keys_id_seq'::regclass);


--
-- Name: orderitems id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.orderitems ALTER COLUMN id SET DEFAULT nextval('public.orderitems_id_seq'::regclass);


--
-- Name: orders id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.orders ALTER COLUMN id SET DEFAULT nextval('public.orders_id_seq'::regclass);


--
-- Name: payments id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.payments ALTER COLUMN id SET DEFAULT nextval('public.payments_id_seq'::regclass);


--
-- Name: platforms id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.platforms ALTER COLUMN id SET DEFAULT nextval('public.platforms_id_seq'::regclass);


--
-- Name: roles id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.roles ALTER COLUMN id SET DEFAULT nextval('public.roles_id_seq'::regclass);


--
-- Name: userroles id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.userroles ALTER COLUMN id SET DEFAULT nextval('public.userroles_id_seq'::regclass);


--
-- Name: users id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users ALTER COLUMN id SET DEFAULT nextval('public.users_id_seq'::regclass);


--
-- Name: usersettings id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.usersettings ALTER COLUMN id SET DEFAULT nextval('public.usersettings_id_seq'::regclass);


--
-- Data for Name: accounts; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.accounts (id, game_id, login, password_encrypted, price, status) FROM stdin;
1	1	csgo_pro	encrypted_csgo	29.99	sold
2	2	fifa_legend	encrypted_fifa	43.99	available
\.


--
-- Data for Name: auditlog; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.auditlog (id, user_id, action, table_name, old_value, new_value, "timestamp") FROM stdin;
1	\N	UPDATE	accounts	{"id": 1, "login": "csgo_pro", "price": 29.99, "status": "available", "game_id": 1, "password_encrypted": "encrypted_csgo"}	{"id": 1, "login": "csgo_pro", "price": 29.99, "status": "sold", "game_id": 1, "password_encrypted": "encrypted_csgo"}	2025-11-10 13:49:45.987378
2	\N	UPDATE	accounts	{"id": 2, "login": "fifa_legend", "price": 39.99, "status": "available", "game_id": 2, "password_encrypted": "encrypted_fifa"}	{"id": 2, "login": "fifa_legend", "price": 43.99, "status": "available", "game_id": 2, "password_encrypted": "encrypted_fifa"}	2025-11-10 13:54:53.367209
\.


--
-- Data for Name: games; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.games (id, title, platform_id, description, created_at) FROM stdin;
1	Counter-Strike 2	1	Шутер от Valve	2025-11-10 13:11:35.073713
2	FIFA 25	2	Футбол от EA	2025-11-10 13:11:35.073713
3	Fortnite	3	Battle Royale от Epic	2025-11-10 13:11:35.073713
\.


--
-- Data for Name: keys; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.keys (id, game_id, key_code_encrypted, price, status) FROM stdin;
1	1	steam_key_csgo_abc	21.99	available
2	2	ea_key_fifa_xyz	27.49	available
\.


--
-- Data for Name: orderitems; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.orderitems (id, order_id, item_type, item_id, quantity) FROM stdin;
1	7	account	1	1
\.


--
-- Data for Name: orders; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.orders (id, user_id, total_price, status, created_at) FROM stdin;
7	2	29.99	completed	2025-11-10 13:49:45.987378
\.


--
-- Data for Name: payments; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.payments (id, order_id, amount, method, status) FROM stdin;
\.


--
-- Data for Name: platforms; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.platforms (id, name, description, created_at) FROM stdin;
1	Steam	Valve Steam Platform	2025-11-10 13:11:35.059175
2	EA App	Electronic Arts (ex-Origin)	2025-11-10 13:11:35.059175
3	Epic Games	Epic Games Store	2025-11-10 13:11:35.059175
4	Battle.net	Blizzard Battle.net	2025-11-10 13:11:35.059175
5	Xbox	Microsoft Xbox	2025-11-10 13:11:35.059175
6	PlayStation	Sony PlayStation Network	2025-11-10 13:11:35.059175
7	GOG	GOG.com DRM-Free	2025-11-10 13:11:35.059175
8	Ubisoft Connect	Ubisoft Connect	2025-11-10 13:11:35.059175
\.


--
-- Data for Name: roles; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.roles (id, name, description, created_at) FROM stdin;
1	admin	Полный доступ	2025-11-10 13:11:35.062947
2	user	Обычный покупатель	2025-11-10 13:11:35.062947
3	manager	Управление заказами	2025-11-10 13:11:35.062947
4	moderator	Модерация контента	2025-11-10 13:11:35.062947
\.


--
-- Data for Name: userroles; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.userroles (id, user_id, role_id, assigned_at) FROM stdin;
1	1	1	2025-11-10 13:11:35.069244
2	1	3	2025-11-10 13:11:35.069244
3	2	2	2025-11-10 13:11:35.069244
\.


--
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.users (id, username, email, password_hash, created_at) FROM stdin;
1	admin	admin@example.com	$2b$10$hashed_admin_pass	2025-11-10 13:11:35.065529
2	user1	user1@example.com	$2b$10$hashed_user_pass	2025-11-10 13:11:35.065529
\.


--
-- Data for Name: usersettings; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.usersettings (id, user_id, theme, date_format, page_size) FROM stdin;
\.


--
-- Name: accounts_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.accounts_id_seq', 2, true);


--
-- Name: auditlog_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.auditlog_id_seq', 2, true);


--
-- Name: games_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.games_id_seq', 3, true);


--
-- Name: keys_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.keys_id_seq', 2, true);


--
-- Name: orderitems_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.orderitems_id_seq', 1, true);


--
-- Name: orders_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.orders_id_seq', 7, true);


--
-- Name: payments_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.payments_id_seq', 1, false);


--
-- Name: platforms_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.platforms_id_seq', 8, true);


--
-- Name: roles_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.roles_id_seq', 4, true);


--
-- Name: userroles_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.userroles_id_seq', 3, true);


--
-- Name: users_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.users_id_seq', 2, true);


--
-- Name: usersettings_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.usersettings_id_seq', 1, false);


--
-- Name: accounts accounts_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.accounts
    ADD CONSTRAINT accounts_pkey PRIMARY KEY (id);


--
-- Name: auditlog auditlog_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.auditlog
    ADD CONSTRAINT auditlog_pkey PRIMARY KEY (id);


--
-- Name: games games_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.games
    ADD CONSTRAINT games_pkey PRIMARY KEY (id);


--
-- Name: keys keys_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.keys
    ADD CONSTRAINT keys_pkey PRIMARY KEY (id);


--
-- Name: orderitems orderitems_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.orderitems
    ADD CONSTRAINT orderitems_pkey PRIMARY KEY (id);


--
-- Name: orders orders_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.orders
    ADD CONSTRAINT orders_pkey PRIMARY KEY (id);


--
-- Name: payments payments_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.payments
    ADD CONSTRAINT payments_pkey PRIMARY KEY (id);


--
-- Name: platforms platforms_name_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.platforms
    ADD CONSTRAINT platforms_name_key UNIQUE (name);


--
-- Name: platforms platforms_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.platforms
    ADD CONSTRAINT platforms_pkey PRIMARY KEY (id);


--
-- Name: roles roles_name_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.roles
    ADD CONSTRAINT roles_name_key UNIQUE (name);


--
-- Name: roles roles_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.roles
    ADD CONSTRAINT roles_pkey PRIMARY KEY (id);


--
-- Name: userroles userroles_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.userroles
    ADD CONSTRAINT userroles_pkey PRIMARY KEY (id);


--
-- Name: userroles userroles_user_id_role_id_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.userroles
    ADD CONSTRAINT userroles_user_id_role_id_key UNIQUE (user_id, role_id);


--
-- Name: users users_email_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_email_key UNIQUE (email);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- Name: users users_username_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_username_key UNIQUE (username);


--
-- Name: usersettings usersettings_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.usersettings
    ADD CONSTRAINT usersettings_pkey PRIMARY KEY (id);


--
-- Name: usersettings usersettings_user_id_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.usersettings
    ADD CONSTRAINT usersettings_user_id_key UNIQUE (user_id);


--
-- Name: idx_accounts_game; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_accounts_game ON public.accounts USING btree (game_id);


--
-- Name: idx_games_platform; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_games_platform ON public.games USING btree (platform_id);


--
-- Name: idx_keys_game; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_keys_game ON public.keys USING btree (game_id);


--
-- Name: idx_orders_user; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_orders_user ON public.orders USING btree (user_id);


--
-- Name: idx_userroles_user; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_userroles_user ON public.userroles USING btree (user_id);


--
-- Name: v_active_users _RETURN; Type: RULE; Schema: public; Owner: postgres
--

CREATE OR REPLACE VIEW public.v_active_users AS
 SELECT u.id,
    u.username,
    u.email,
    count(o.id) AS orders_count,
    sum(o.total_price) AS total_spent,
    max(o.created_at) AS last_order
   FROM (public.users u
     LEFT JOIN public.orders o ON (((o.user_id = u.id) AND (o.created_at >= (now() - '30 days'::interval)))))
  GROUP BY u.id
 HAVING (count(o.id) > 0)
  ORDER BY (sum(o.total_price)) DESC;


--
-- Name: accounts trg_audit_accounts; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER trg_audit_accounts AFTER DELETE OR UPDATE ON public.accounts FOR EACH ROW EXECUTE FUNCTION public.trigger_audit_accounts();


--
-- Name: accounts trg_prevent_sold_account_delete; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER trg_prevent_sold_account_delete BEFORE DELETE ON public.accounts FOR EACH ROW EXECUTE FUNCTION public.prevent_sold_item_delete();


--
-- Name: keys trg_prevent_sold_key_delete; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER trg_prevent_sold_key_delete BEFORE DELETE ON public.keys FOR EACH ROW EXECUTE FUNCTION public.prevent_sold_item_delete();


--
-- Name: orderitems trg_update_order_total; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER trg_update_order_total AFTER INSERT OR DELETE OR UPDATE ON public.orderitems FOR EACH ROW EXECUTE FUNCTION public.update_order_total();


--
-- Name: accounts accounts_game_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.accounts
    ADD CONSTRAINT accounts_game_id_fkey FOREIGN KEY (game_id) REFERENCES public.games(id) ON DELETE CASCADE;


--
-- Name: auditlog auditlog_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.auditlog
    ADD CONSTRAINT auditlog_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- Name: games games_platform_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.games
    ADD CONSTRAINT games_platform_id_fkey FOREIGN KEY (platform_id) REFERENCES public.platforms(id) ON DELETE RESTRICT;


--
-- Name: keys keys_game_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.keys
    ADD CONSTRAINT keys_game_id_fkey FOREIGN KEY (game_id) REFERENCES public.games(id) ON DELETE CASCADE;


--
-- Name: orderitems orderitems_order_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.orderitems
    ADD CONSTRAINT orderitems_order_id_fkey FOREIGN KEY (order_id) REFERENCES public.orders(id) ON DELETE CASCADE;


--
-- Name: orders orders_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.orders
    ADD CONSTRAINT orders_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: payments payments_order_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.payments
    ADD CONSTRAINT payments_order_id_fkey FOREIGN KEY (order_id) REFERENCES public.orders(id) ON DELETE CASCADE;


--
-- Name: userroles userroles_role_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.userroles
    ADD CONSTRAINT userroles_role_id_fkey FOREIGN KEY (role_id) REFERENCES public.roles(id) ON DELETE CASCADE;


--
-- Name: userroles userroles_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.userroles
    ADD CONSTRAINT userroles_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: usersettings usersettings_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.usersettings
    ADD CONSTRAINT usersettings_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: TABLE accounts; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.accounts TO admin_role;
GRANT SELECT ON TABLE public.accounts TO user_role;


--
-- Name: SEQUENCE accounts_id_seq; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON SEQUENCE public.accounts_id_seq TO admin_role;


--
-- Name: TABLE auditlog; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.auditlog TO admin_role;


--
-- Name: SEQUENCE auditlog_id_seq; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON SEQUENCE public.auditlog_id_seq TO admin_role;


--
-- Name: TABLE games; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.games TO admin_role;
GRANT SELECT ON TABLE public.games TO user_role;
GRANT SELECT ON TABLE public.games TO guest_role;


--
-- Name: SEQUENCE games_id_seq; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON SEQUENCE public.games_id_seq TO admin_role;


--
-- Name: TABLE keys; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.keys TO admin_role;
GRANT SELECT ON TABLE public.keys TO user_role;


--
-- Name: SEQUENCE keys_id_seq; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON SEQUENCE public.keys_id_seq TO admin_role;


--
-- Name: TABLE orderitems; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.orderitems TO admin_role;
GRANT SELECT,INSERT,UPDATE ON TABLE public.orderitems TO user_role;


--
-- Name: SEQUENCE orderitems_id_seq; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON SEQUENCE public.orderitems_id_seq TO admin_role;


--
-- Name: TABLE orders; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.orders TO admin_role;
GRANT SELECT,INSERT,UPDATE ON TABLE public.orders TO user_role;


--
-- Name: SEQUENCE orders_id_seq; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON SEQUENCE public.orders_id_seq TO admin_role;


--
-- Name: TABLE payments; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.payments TO admin_role;
GRANT SELECT,INSERT,UPDATE ON TABLE public.payments TO user_role;


--
-- Name: SEQUENCE payments_id_seq; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON SEQUENCE public.payments_id_seq TO admin_role;


--
-- Name: TABLE platforms; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.platforms TO admin_role;
GRANT SELECT ON TABLE public.platforms TO user_role;
GRANT SELECT ON TABLE public.platforms TO guest_role;


--
-- Name: SEQUENCE platforms_id_seq; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON SEQUENCE public.platforms_id_seq TO admin_role;


--
-- Name: TABLE roles; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.roles TO admin_role;


--
-- Name: SEQUENCE roles_id_seq; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON SEQUENCE public.roles_id_seq TO admin_role;


--
-- Name: TABLE userroles; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.userroles TO admin_role;


--
-- Name: SEQUENCE userroles_id_seq; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON SEQUENCE public.userroles_id_seq TO admin_role;


--
-- Name: TABLE users; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.users TO admin_role;
GRANT SELECT,UPDATE ON TABLE public.users TO user_role;


--
-- Name: SEQUENCE users_id_seq; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON SEQUENCE public.users_id_seq TO admin_role;


--
-- Name: TABLE usersettings; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.usersettings TO admin_role;
GRANT SELECT,UPDATE ON TABLE public.usersettings TO user_role;


--
-- Name: SEQUENCE usersettings_id_seq; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON SEQUENCE public.usersettings_id_seq TO admin_role;


--
-- PostgreSQL database dump complete
--

\unrestrict MtEhXgd8WsOL1ad5xODrS42fwsSsmsLH3DvJiTvJQqUTzbvM5y9rhv1bFObOHuQ

