export default function handler(req, res) {
    const lang = req.query.lang || "en";
  
    const agent = {
      id: "demo-agent-v1",
      nodes: [
        {
          id: "intro",
          type: "scripted",
          message:
            "Hello! This is Alex calling from Leaping AI. Am I speaking to {{name}}?"
        },
        {
          id: "dialogue",
          type: "response",
          message:
            "Have a warm, natural conversation. Ask friendly follow-up questions, gather context, and build rapport. Always end responses with a question."
        },
        {
          id: "closing",
          type: "scripted",
          message: "Thank you so much for your time. Wishing you a great day!"
        }
      ],
      idle: {
        id: "idle",
        type: "idle",
        message: "Hey, I'm still here — are you still with me?"
      },
      summary: {
        id: "summary",
        type: "setup",
        message:
          "Summarize the conversation concisely with key user information and next-step actions."
      }
    };
  
    res.status(200).json(agent);
  }
  