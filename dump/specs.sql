--
-- PostgreSQL database dump
--

-- Dumped from database version 17.4 (Debian 17.4-1.pgdg120+2)
-- Dumped by pg_dump version 17.4 (Debian 17.4-1.pgdg120+2)

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

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: game_specs; Type: TABLE; Schema: public; Owner: admin
--

CREATE TABLE public.game_specs (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    title character varying NOT NULL,
    description character varying NOT NULL,
    illustration character varying,
    rules character varying,
    "defaultRoundDuration" integer NOT NULL,
    "pointStep" integer NOT NULL,
    "pointsMax" integer NOT NULL,
    "withGuesses" boolean NOT NULL,
    "createdAt" timestamp without time zone DEFAULT now() NOT NULL,
    "updatedAt" timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.game_specs OWNER TO admin;

--
-- Data for Name: game_specs; Type: TABLE DATA; Schema: public; Owner: admin
--

COPY public.game_specs (id, title, description, illustration, rules, "defaultRoundDuration", "pointStep", "pointsMax", "withGuesses", "createdAt", "updatedAt") FROM stdin;
0993d837-182b-47a2-a6bb-0b0a97f709e7	Griffonary	Dessinez et gagnez des points en faisant deviner des mots à vos amis !\r\nPour un max de fun ! 	uploads\\public\\game-0993d837-182b-47a2-a6bb-0b0a97f709e7.webp	A tour de rôle, tous les joueurs devront faire deviner un mot tiré au hasard en dessinant. \r\nL'artiste marque des points pour chaque personne reconnaissant son talent.\r\nLes autres joueurs marquent également des points lorqu'ils trouvent le mot, mais il faut être rapide: l'ordre de réussite impact le nombre de points marqués...	90000	47	404	t	2025-04-10 17:54:05.972259	2025-05-16 17:20:00.692294
\.


--
-- Name: game_specs PK_84a918e2269e01e7e083033eb48; Type: CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.game_specs
    ADD CONSTRAINT "PK_84a918e2269e01e7e083033eb48" PRIMARY KEY (id);


--
-- PostgreSQL database dump complete
--

