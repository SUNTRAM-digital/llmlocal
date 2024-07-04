import {CreateWebWorkerMLCEngine } from "https://esm.run/@mlc-ai/web-llm";

const $ = el => document.querySelector(el);
const $form = $("form");
const $input = $('input');
const $template = $('#message-template');
const $messages = $('ul');
const $container = $('main');
const $button = $('button');
const $info = $('small');
const $loader = $('.loader');

let messages = []

//modelo
const SELECTED_MODEL = 'Llama-3-8B-Instruct-q4f32_1-MLC-1k'
const engine = await CreateWebWorkerMLCEngine(
    new Worker('./worker.js',{type:'module'}),
    SELECTED_MODEL,
    {
        initProgressCallback: (info)=>{
            console.log('Init progress: ',info)
            $info.textContent =  `${info.text}%`
            if(info.progress===1){
                $button.removeAttribute('disabled');
            }
        }
    }
)

$form?.addEventListener('submit', async (event) => {
    event.preventDefault();
    const messageText = $input.value.trim()

    if(messageText!==''){
        $input.value=''
    }
    addMessage(messageText,'user')
    $button.setAttribute('disabled','')
    $loader.style.display = 'block';

    const userMessage = {
        role:'user',
        content:messageText
    }

    messages.push(userMessage);

    //reply
    const chunks = await engine.chat.completions.create({
        messages,
        stream:true
    })

    let reply = ""
    const $botText = addMessage("",'bot')

    for await (const chunk of chunks){
        const choice = chunk.choices[0]
        const content = choice?.delta?.content ?? ""
        reply += content
        $botText.textContent = reply
    }


    messages.push({
        role:'GPT',
        content:reply
    });
    $button.removeAttribute('disabled')
    $loader.style.display = 'none';
    $container.scrollTop = $container.scrollHeight
});

function addMessage(text,sender){
    const $clonedTemplate = $template.content.cloneNode(true)
    const $newMessage = $clonedTemplate.querySelector('.message')
    const $who = $newMessage.querySelector('span')
    const $text = $newMessage.querySelector('p')

    $text.textContent = text
    $who.textContent = sender === 'bot' ? 'GPT' : 'Tú'
    $newMessage.classList.add(sender)

    $messages.appendChild($newMessage)
    $container.scrollTop = $container.scrollHeight
    return $text

}