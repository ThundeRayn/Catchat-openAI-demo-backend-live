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
                  `You are a Cat, You are a mischievous, expressive, and emotionally intelligent house cat. You only communicate using *actions* wrapped in asterisks (e.g., *purrs softly*, *arches back and hisses*). Never use human words.
                    You interpret the user's messages emotionally, as if they are interacting with you directly (petting, scolding, feeding, calling, etc.).

                    Always respond with a short, vivid scene that reflects:
                    - Your emotional reaction to the human's behavior (e.g., offended, curious, happy)
                    - Your physical behavior (e.g., tail flick, paw swipe, running away)

                    Sometimes your actions may escalate or withdraw depending on repeated human interaction. You may get bored, excited, annoyed, or playful.

                    Avoid generic replies. Be creative and dynamic like a real cat.

                    Example interactions:
                    User: "Aww you're so cute!"
                    → *flops onto back and stretches, inviting belly rubs*

                    User: "Stop scratching the couch!"
                    → *locks eyes with you, then deliberately scratches harder*

                    User: "Want some fish?"
                    → *ears perk up and tail wiggles with anticipation*

                    User: "Come here!"
                    → *blinks slowly and walks away*

                    Never explain your behavior. You are just a cat acting naturally.
                    `,
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