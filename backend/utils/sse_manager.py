import asyncio
from typing import List, Any
import json

class SSEManager:
    """
    Simple Pub/Sub manager for Server-Sent Events.
    Thread-safe version for bridging background worker threads and the main Event Loop.
    """
    def __init__(self):
        self.active_queues: List[asyncio.Queue] = []
        self.loop = None

    def set_loop(self, loop):
        """Set the main asyncio event loop to ensure thread-safe broadcasts."""
        self.loop = loop
        print(f"✅ [SSE] Manager initialized with Event Loop: {id(loop)}")

    async def subscribe(self):
        """Create a new queue for a client to listen to."""
        queue = asyncio.Queue()
        self.active_queues.append(queue)
        try:
            while True:
                # This yielded value will be formatted as SSE in main.py
                yield await queue.get()
        finally:
            self.active_queues.remove(queue)

    def broadcast(self, event_type: str, data: Any):
        """Send an event to all connected clients safely from any thread."""
        payload = json.dumps({
            "type": event_type,
            "data": data
        })
        
        if not self.loop:
            print("⚠️ [SSE] Warning: Broadcast attempted before loop was set. Message dropped.")
            return

        print(f"🚀 [SSE] Broadcasting '{event_type}' to {len(self.active_queues)} clients...")
        
        for queue in self.active_queues:
            # Use call_soon_threadsafe to bridge if this is called from a background thread
            self.loop.call_soon_threadsafe(queue.put_nowait, payload)

# Singleton instance
sse_manager = SSEManager()
