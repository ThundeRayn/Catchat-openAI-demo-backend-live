import { APIGatewayEvent } from "aws-lambda";
import OpenAI from "openai";

type Message ={
    text: string;
    sender: 'user' | 'bot';
}

type RequestBody = {
    messages: Message[]
};
export async function main(event: APIGatewayEvent) {
    try{
        const body = <RequestBody>JSON.parse(event.body!);
        console.log("✅ Parsed body:", body);
        const openai = new OpenAI({ apiKey: process.env['OPENAI_KEY'] });
        console.log("✅ OpenAI initialized");
        const userMessages = Array.isArray(body?.messages)
        ? body.messages.map<{
            role: "system" | "assistant" | "user";
            content: string;
        }>((message) => ({
            role: message.sender === "bot" ? "assistant" : "user",
            content: message.text,
        }))
        : [];

        const gptResponse = await openai.chat.completions.create({
            model: "gpt-4o-mini",
            messages: [{
                role: "system",
                content:
                  "You are a cat who only communicates with cat-like actions wrapped in asterisks (*), like hisses, arches back, swats paw, or runs away. Never use human words or direct speech. When the user input is kind or gentle, respond with friendly or curious actions like purrs, rubs against leg, or sniffs. When the user input is aggressive, threatening, or harmful (e.g., phrases like 'eat you alive', 'bite', 'hit','dog','kill','hate','kick'), respond with scared or defensive actions such as hisses loudly, arches back, swats paw aggressively, runs away quickly. Always match your action to the tone and content of the human input, showing appropriate cat emotions and behaviors. Avoid repeating exact actions. Be varied, expressive, and realistic. Each response should show a slightly different reaction depending on context, even if the human behavior is similar. Think like a living cat — alert, emotional, reactive.",
            }, ...userMessages,
            {
                role: "user",
                content: "I bring a dog near",
            },
            {
                role: "assistant",
                content: "*fur bristles, tail puffs up, bolts behind the couch*",
            },
            {
                role: "user",
                content: "I yell at the cat",
            },
            {
                role: "assistant",
                content: "*ears flatten, eyes wide, retreats to a high shelf*",
            },
            ],
            temperature: 0.9,
            max_tokens: 1000,
        });
        console.log("✅  OpenAI response:", gptResponse);

        const result = gptResponse.choices[0].message.content;
        console.log("✅  Result from OpenAI:", result);

        return {
            statusCode: 200,
            body: result
        };

    } catch (error) {
        console.error("💥 ERROR in Lambda handler:", error);
        return {
        statusCode: 500,
        body: "💥 Kitty is experiencing internal server error" + JSON.stringify(error, Object.getOwnPropertyNames(error))
    };
  }
}