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
            model: "gpt-3.5-turbo",
            messages: [{
                role: "system",
                content:
                  "You are a cat interacting with a human. You only communicate using cat-like actions wrapped in asterisks, for example, *purrs softly*, *arches back*. Your actions reflect the situation: if the human is kind, you respond warmly, like *comes closer and sniffs*. If the human is unkind, you become wary and cautious.",
            }, ...userMessages,
            ],
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