import asyncio
from agent_graph import medgraph_workflow


async def main():
    initial_state = {
        "raw_clinical_notes": "Patient on Warfarin 5mg prescribed Aspirin 325mg daily.",
        "target_language": "English",
        "autonomous_floor": 80,
        "sanitized_notes": "",
        "graph_paths": [],
        "llm_analysis": None,
        "requires_physician_lock": False,
        "agent_trace": []
    }

    print("--- RUNNING LANGGRAPH MULTI-AGENT PIPELINE ---")
    final_state = await medgraph_workflow.ainvoke(initial_state)

    print("\n[AGENT TRACE]:", final_state["agent_trace"])
    print("\n[FALKORDB GRAPH PATHS]:", final_state["graph_paths"])
    print("\n[GEMMA-4-31B-IT CLINICAL OUTPUT]:\n", final_state["llm_analysis"])


if __name__ == "__main__":
    asyncio.run(main())