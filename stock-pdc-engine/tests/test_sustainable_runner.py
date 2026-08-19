from __future__ import annotations

import json
from pathlib import Path
import unittest

from stock_pdc.committee_audit import MODEL_IDS
from stock_pdc.sustainable.roster import (
    CLAUDE_RUNNER,
    CODEX_RUNNER,
    DEFAULT_ROSTER,
    Member,
    validate_roster,
)
from stock_pdc.sustainable.runner import (
    TOKEN_FROM_ENVIRONMENT,
    TOKEN_FROM_KEYCHAIN,
    TOKEN_MISSING,
    TOKEN_NOT_REQUIRED,
    RunnerOutcome,
    _first_json_object,
    _unwrap,
    resolve_token,
)


SECRET = "sk-ant-oat01-EXAMPLE-NOT-A-REAL-TOKEN"


class RosterTest(unittest.TestCase):
    def test_default_roster_is_recordable_by_the_audit_contract(self) -> None:
        validate_roster(DEFAULT_ROSTER)
        self.assertLessEqual({member.model_id for member in DEFAULT_ROSTER}, set(MODEL_IDS))

    def test_rejects_a_single_seat(self) -> None:
        with self.assertRaises(ValueError):
            validate_roster((DEFAULT_ROSTER[0],))

    def test_rejects_two_seats_sharing_one_model_id(self) -> None:
        with self.assertRaises(ValueError):
            validate_roster((DEFAULT_ROSTER[0], Member("sol2", "Sol 2", "gpt", "claude")))

    def test_rejects_a_model_id_the_audit_contract_cannot_store(self) -> None:
        with self.assertRaises(ValueError):
            validate_roster((DEFAULT_ROSTER[0], Member("x", "X", "nope", "claude")))

    def test_rejects_an_unknown_local_cli(self) -> None:
        with self.assertRaises(ValueError):
            validate_roster((DEFAULT_ROSTER[0], Member("x", "X", "gemini", "no-such-cli")))


class JsonExtractionTest(unittest.TestCase):
    def test_plain_object_is_extracted(self) -> None:
        self.assertEqual(
            _first_json_object('{"provider_test": true, "score": 7}'),
            {"provider_test": True, "score": 7},
        )

    def test_braces_inside_strings_do_not_break_extraction(self) -> None:
        self.assertEqual(
            _first_json_object('{"a": "has { an unbalanced brace"}'),
            {"a": "has { an unbalanced brace"},
        )

    def test_escaped_quote_inside_string_does_not_end_the_string(self) -> None:
        self.assertEqual(
            _first_json_object(r'{"a": "she said \"hi\" { ", "b": 1}'),
            {"a": 'she said "hi" { ', "b": 1},
        )

    def test_leading_transcript_noise_is_skipped(self) -> None:
        text = 'Thinking...\nHere it is:\n{"provider_test": true, "score": 7}\nDone.'
        self.assertEqual(_first_json_object(text), {"provider_test": True, "score": 7})

    def test_unparseable_text_returns_none(self) -> None:
        self.assertIsNone(_first_json_object("no json here at all"))
        self.assertIsNone(_first_json_object("{not: valid, json}"))

    def test_a_non_object_json_value_is_not_accepted(self) -> None:
        self.assertIsNone(_first_json_object("[1, 2, 3]"))


class EnvelopeTest(unittest.TestCase):
    def test_fenced_json_inside_a_cli_envelope_is_unwrapped(self) -> None:
        envelope = {"type": "result", "result": '```json\n{"provider_test": true, "score": 7}\n```'}
        parsed = _first_json_object(json.dumps(envelope))
        self.assertIsNotNone(parsed)
        assert parsed is not None
        self.assertEqual(_unwrap(parsed), {"provider_test": True, "score": 7})

    def test_nested_object_envelope_is_unwrapped(self) -> None:
        envelope = {"type": "result", "result": {"provider_test": True, "score": 7}}
        self.assertEqual(_unwrap(envelope), {"provider_test": True, "score": 7})

    def test_bare_answer_without_an_envelope_is_returned_unchanged(self) -> None:
        answer = {"provider_test": True, "score": 7}
        self.assertEqual(_unwrap(answer), answer)

    def test_envelope_with_unparseable_result_string_falls_back_to_the_envelope(self) -> None:
        # A tolerant parse must not invent an answer; the caller validates shape.
        envelope = {"type": "result", "result": "the model refused"}
        self.assertEqual(_unwrap(envelope), envelope)


class TokenResolutionTest(unittest.TestCase):
    def test_a_seat_inheriting_desktop_credentials_needs_no_token(self) -> None:
        token, source = resolve_token(CODEX_RUNNER, {}, lambda service: SECRET)
        self.assertEqual(token, "")
        self.assertEqual(source, TOKEN_NOT_REQUIRED)

    def test_exported_variable_wins_so_a_scheduled_job_can_supply_it(self) -> None:
        environ = {CLAUDE_RUNNER.token_env_var: SECRET}
        token, source = resolve_token(CLAUDE_RUNNER, environ, lambda service: "keychain-value")
        self.assertEqual(token, SECRET)
        self.assertEqual(source, TOKEN_FROM_ENVIRONMENT)

    def test_keychain_is_used_when_no_variable_is_exported(self) -> None:
        token, source = resolve_token(CLAUDE_RUNNER, {}, lambda service: SECRET)
        self.assertEqual(token, SECRET)
        self.assertEqual(source, TOKEN_FROM_KEYCHAIN)

    def test_keychain_is_queried_for_the_expected_service(self) -> None:
        asked: list[str] = []

        def lookup(service: str) -> str:
            asked.append(service)
            return SECRET

        resolve_token(CLAUDE_RUNNER, {}, lookup)
        self.assertEqual(asked, [CLAUDE_RUNNER.keychain_service])

    def test_blank_values_are_not_mistaken_for_a_token(self) -> None:
        environ = {CLAUDE_RUNNER.token_env_var: "   "}
        token, source = resolve_token(CLAUDE_RUNNER, environ, lambda service: "  \n ")
        self.assertEqual(token, "")
        self.assertEqual(source, TOKEN_MISSING)

    def test_missing_token_is_reported_rather_than_guessed(self) -> None:
        token, source = resolve_token(CLAUDE_RUNNER, {}, lambda service: "")
        self.assertEqual(token, "")
        self.assertEqual(source, TOKEN_MISSING)


class SecretLeakTest(unittest.TestCase):
    """A credential must never reach a report, a log line, or a command line."""

    def test_reported_outcome_carries_provenance_but_not_the_secret(self) -> None:
        outcome = RunnerOutcome(
            ok=True,
            output={"provider_test": True, "score": 7},
            command=["/path/to/claude", "-p", "prompt text"],
            exit_code=0,
            error="",
            stdout_excerpt="all good",
            token_source=TOKEN_FROM_KEYCHAIN,
        )
        serialized = json.dumps(outcome.to_json(), ensure_ascii=False)
        self.assertNotIn(SECRET, serialized)
        self.assertIn(TOKEN_FROM_KEYCHAIN, serialized)

    def test_no_seat_places_its_token_in_the_command_line(self) -> None:
        for member in DEFAULT_ROSTER:
            joined = " ".join(_argv_for(member.runner))
            self.assertNotIn(SECRET, joined)
            # Credentials travel in the child environment, never in argv.
            self.assertNotIn(member.runner.token_env_var or "\x00", joined)


def _argv_for(runner, schema_json: str = '{"type":"object"}') -> list[str]:
    return runner.argv(
        Path("/bin/true"),
        Path("/tmp/ws"),
        Path("/tmp/ws/output_schema.json"),
        Path("/tmp/ws/result.json"),
        "prompt text",
        schema_json,
    )


class SchemaDeliveryTest(unittest.TestCase):
    """The two CLIs disagree about how a schema arrives; both must be honoured."""

    def test_codex_receives_the_schema_as_a_file_path(self) -> None:
        argv = _argv_for(CODEX_RUNNER)
        self.assertIn("--output-schema", argv)
        self.assertIn("/tmp/ws/output_schema.json", argv)

    def test_claude_receives_the_schema_inline(self) -> None:
        # Passing a path here fails with "not valid JSON", and the seat then
        # answers free-form while the other is held to contract.
        argv = _argv_for(CLAUDE_RUNNER, '{"type":"object"}')
        self.assertIn("--json-schema", argv)
        self.assertIn('{"type":"object"}', argv)
        self.assertNotIn("/tmp/ws/output_schema.json", argv)

    def test_every_seat_is_given_the_schema_somehow(self) -> None:
        for member in DEFAULT_ROSTER:
            argv = _argv_for(member.runner)
            self.assertTrue(
                any("schema" in part for part in argv),
                f"{member.member_id} 的命令里没有传 schema",
            )


if __name__ == "__main__":
    unittest.main()
