package expo.modules.a5mediapipe

import com.google.mediapipe.tasks.genai.llminference.LlmInference
import com.google.mediapipe.tasks.genai.llminference.LlmInference.LlmInferenceOptions
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition
import expo.modules.kotlin.Promise
import expo.modules.kotlin.records.Field
import expo.modules.kotlin.records.Record
import java.util.concurrent.atomic.AtomicInteger

class TaskOptions : Record {
    @Field
    lateinit var modelPath: String
    @Field
    var maxTokens: Int = 512
    @Field
    var topK: Int = 40
    @Field
    var temperature: Float = 0.8f
    @Field
    var randomSeed: Int = 0
}

class ExpoA5MediapipeModule : Module() {
    private val taskInstances = mutableMapOf<Int, LlmInference>()
    private val nextTaskId = AtomicInteger(0)

    override fun definition() = ModuleDefinition {
        Name("ExpoA5Mediapipe")

        Events("onPartialResponse", "onErrorResponse")

        AsyncFunction("createTask") { options: TaskOptions, promise: Promise ->
            try {
                val llmOptions = LlmInferenceOptions.builder()
                    .setModelPath(options.modelPath)
                    .setMaxTokens(options.maxTokens)
                    .setMaxTopK(options.topK)
                    // Temperature and RandomSeed might not be available in the current API
                    // .setTemperature(options.temperature)
                    // .setRandomSeed(options.randomSeed)
                    .build()

                val llmInference = LlmInference.createFromOptions(appContext.reactContext, llmOptions)
                val taskId = nextTaskId.getAndIncrement()
                taskInstances[taskId] = llmInference
                promise.resolve(arrayOf(taskId, null))
            } catch (e: Exception) {
                promise.resolve(arrayOf(null, e.message))
            }
        }

        AsyncFunction("generateResponse") { taskHandle: Int, prompt: String, promise: Promise ->
            val instance = taskInstances[taskHandle]
            if (instance == null) {
                promise.resolve(arrayOf(null, "Invalid task handle"))
                return@AsyncFunction
            }

            try {
                val result = instance.generateResponse(prompt)
                promise.resolve(arrayOf(result, null))
            } catch (e: Exception) {
                promise.resolve(arrayOf(null, e.message))
            }
        }

        AsyncFunction("generateResponseAsync") { taskHandle: Int, prompt: String, promise: Promise ->
            val instance = taskInstances[taskHandle]
            if (instance == null) {
                promise.resolve(arrayOf(null, "Invalid task handle"))
                return@AsyncFunction
            }

            try {
                instance.generateResponseAsync(prompt) { partialResult: String, done: Boolean ->
                    sendEvent("onPartialResponse", mapOf(
                        "payload" to arrayOf(partialResult, null),
                        "done" to done
                    ))
                }
                promise.resolve(arrayOf(true, null))
            } catch (e: Exception) {
                promise.resolve(arrayOf(null, e.message))
            }
        }

        AsyncFunction("releaseTask") { taskHandle: Int, promise: Promise ->
            val instance = taskInstances.remove(taskHandle)
            if (instance == null) {
                promise.resolve(arrayOf(null, "Invalid task handle"))
                return@AsyncFunction
            }

            try {
                instance.close()
                promise.resolve(arrayOf(true, null))
            } catch (e: Exception) {
                promise.resolve(arrayOf(null, e.message))
            }
        }
    }
}