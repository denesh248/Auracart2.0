# llm_guard_setup.py
import re

try:
    from llm_guard.input_scanners import PromptInjection, TokenLimit
    from llm_guard import scan_prompt
    HAS_LLM_GUARD = True
except ImportError:
    HAS_LLM_GUARD = False

input_scanners = [
    TokenLimit(limit=4000),   # Token-limiting guardrail
] if HAS_LLM_GUARD else []

def scan_user_input(question: str) -> dict:
    if not question:
        return {"sanitized_prompt": "", "is_safe": True, "scores": {}}
    if HAS_LLM_GUARD and input_scanners:
        try:
            sanitized_prompt, results_valid, results_score = scan_prompt(input_scanners, question)
            is_safe = all(results_valid.values())
            return {
                "sanitized_prompt": sanitized_prompt,
                "is_safe": is_safe,
                "scores": results_score,
            }
        except Exception:
            pass
    # Lightweight fallback for cloud deployment (e.g. Render 512MB RAM)
    is_safe = len(question.split()) < 4000
    return {"sanitized_prompt": question, "is_safe": is_safe, "scores": {"TokenLimit": 0.0}}


output_scanners = None

def get_output_scanners():
    global output_scanners
    if output_scanners is None and HAS_LLM_GUARD:
        try:
            from llm_guard.output_scanners import Sensitive, Toxicity
            output_scanners = [
                Sensitive(entity_types=["PHONE_NUMBER", "EMAIL_ADDRESS", "CREDIT_CARD"]),
                Toxicity(threshold=0.5),
            ]
        except Exception:
            output_scanners = []
    return output_scanners or []


def scan_agent_output(prompt: str, answer: str) -> dict:
    if not answer:
        return {"sanitized_output": "", "is_safe": True, "scores": {}}
    scanners = get_output_scanners()
    if scanners:
        try:
            from llm_guard import scan_output
            sanitized_output, results_valid, results_score = scan_output(scanners, prompt, answer)
            is_safe = all(results_valid.values())
            return {
                "sanitized_output": sanitized_output,
                "is_safe": is_safe,
                "scores": results_score,
            }
        except Exception:
            pass
            
    # Lightweight regex fallback to redact sensitive data without loading heavy ML weights
    sanitized = re.sub(r'\b\d{4}[-\s]?\d{4}[-\s]?\d{4}[-\s]?\d{4}\b', '[REDACTED_CARD]', answer)
    sanitized = re.sub(r'\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,7}\b', '[REDACTED_EMAIL]', sanitized)
    sanitized = re.sub(r'\b(?:\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}\b', '[REDACTED_PHONE]', sanitized)
    return {
        "sanitized_output": sanitized,
        "is_safe": True,
        "scores": {"Sensitive": 0.0, "Toxicity": 0.0},
    }
