import React, { useState } from 'react';
import { Sparkles, Book, ArrowRight, ArrowLeft, Loader2, Heart, Star, Moon, ChevronRight } from 'lucide-react';

const BedtimeStoryGenerator = () => {
    const [currentStep, setCurrentStep] = useState(0);
    const [isGenerating, setIsGenerating] = useState(false);
    const [generatedStory, setGeneratedStory] = useState('');
    const [formData, setFormData] = useState({
        age: '',
        gender: '',
        interests: [],
        style: '',
        lesson: ''
    });

    const interests = [
        'Animals', 'Space & Stars', 'Ocean & Sea Life', 'Dinosaurs', 'Magic & Fantasy',
        'Sports', 'Music', 'Art & Drawing', 'Nature & Forest', 'Superheroes',
        'Vehicles & Transportation', 'Cooking & Food', 'Science & Experiments'
    ];

    const styles = [
        { value: 'funny', label: 'Funny & Silly', emoji: '😄', desc: 'Giggles and laughs throughout' },
        { value: 'adventurous', label: 'Adventurous & Exciting', emoji: '🌟', desc: 'Thrilling quests and discoveries' },
        { value: 'gentle', label: 'Gentle & Calming', emoji: '🌙', desc: 'Peaceful and soothing' },
        { value: 'magical', label: 'Magical & Enchanting', emoji: '✨', desc: 'Fantasy and wonder' },
        { value: 'educational', label: 'Educational & Learning', emoji: '📚', desc: 'Fun facts and knowledge' }
    ];

    const totalSteps = 7; // age, gender, interests, style, lesson, generating, story

    const handleInterestToggle = (interest) => {
        setFormData(prev => ({
            ...prev,
            interests: prev.interests.includes(interest)
                ? prev.interests.filter(i => i !== interest)
                : [...prev.interests, interest]
        }));
    };

    const nextStep = () => {
        if (currentStep < totalSteps - 1) {
            setCurrentStep(currentStep + 1);
        }
    };

    const prevStep = () => {
        if (currentStep > 0) {
            setCurrentStep(currentStep - 1);
        }
    };

    const generateStory = async () => {
        setIsGenerating(true);
        setCurrentStep(5); // loading step

        try {
            const prompt = `Create a bedtime story for a ${formData.age}-year-old ${formData.gender} who loves ${formData.interests.join(', ')}. 

The story should be:
- Written in a ${formData.style} style
- Teach the lesson: ${formData.lesson}
- Appropriate for bedtime (calming ending)
- Engaging but not overstimulating
- Around 300-500 words long
- Include a gentle moral lesson naturally woven into the narrative

Please write only the story content, no title or additional formatting.`;

            const response = await window.claude.complete(prompt);
            setGeneratedStory(response);
            setCurrentStep(6); // story step
        } catch (error) {
            console.error('Error generating story:', error);
            alert('Sorry, there was an error generating your story. Please try again.');
            setCurrentStep(4); // back to lesson step
        } finally {
            setIsGenerating(false);
        }
    };

    const resetForm = () => {
        setCurrentStep(0);
        setGeneratedStory('');
        setFormData({
            age: '',
            gender: '',
            interests: [],
            style: '',
            lesson: ''
        });
    };

    const canProceed = () => {
        switch (currentStep) {
            case 0: return formData.age !== '';
            case 1: return formData.gender !== '';
            case 2: return formData.interests.length > 0;
            case 3: return formData.style !== '';
            case 4: return formData.lesson.trim() !== '';
            default: return true;
        }
    };

    const getStepTitle = () => {
        const titles = [
            "How old is your little one?",
            "Tell us about your child",
            "What does your child love?",
            "What kind of story would you like?",
            "What lesson should we include?",
            "Creating your magical story...",
            "Your bedtime story is ready!"
        ];
        return titles[currentStep];
    };

    const getStepSubtitle = () => {
        const subtitles = [
            "This helps us choose the perfect vocabulary and themes",
            "We'll use the right pronouns and perspective",
            "Pick 1-3 things that spark their imagination",
            "Choose the tone that fits bedtime best",
            "What important message should they learn?",
            "Our storytelling magic is working...",
            "Sweet dreams are just a story away!"
        ];
        return subtitles[currentStep];
    };

    // Step 0: Age
    if (currentStep === 0) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-indigo-100 via-purple-50 to-pink-100 flex items-center justify-center p-4">
                <div className="bg-white rounded-3xl shadow-2xl p-8 max-w-md w-full">
                    <div className="text-center mb-8">
                        <div className="flex justify-center mb-4">
                            <Sparkles className="w-12 h-12 text-indigo-500" />
                        </div>
                        <h1 className="text-3xl font-bold text-gray-800 mb-2">{getStepTitle()}</h1>
                        <p className="text-gray-600">{getStepSubtitle()}</p>
                    </div>

                    <div className="space-y-6">
                        <input
                            type="number"
                            value={formData.age}
                            onChange={(e) => setFormData({ ...formData, age: e.target.value })}
                            placeholder="Enter age (2-12)"
                            min="2"
                            max="12"
                            className="w-full px-6 py-4 border-2 border-gray-200 rounded-2xl focus:border-indigo-500 focus:outline-none transition-colors text-2xl text-center font-bold"
                            autoFocus
                        />

                        <button
                            onClick={nextStep}
                            disabled={!canProceed()}
                            className="w-full bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white py-4 px-6 rounded-2xl font-bold text-lg transition-all duration-200 transform hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3"
                        >
                            Continue
                            <ArrowRight className="w-5 h-5" />
                        </button>
                    </div>

                    <div className="mt-8 text-center">
                        <div className="text-sm text-gray-500">Step 1 of 5</div>
                        <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                            <div className="bg-indigo-500 h-2 rounded-full transition-all duration-300" style={{ width: '20%' }}></div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    // Step 1: Gender
    if (currentStep === 1) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-indigo-100 via-purple-50 to-pink-100 flex items-center justify-center p-4">
                <div className="bg-white rounded-3xl shadow-2xl p-8 max-w-md w-full">
                    <div className="text-center mb-8">
                        <div className="flex justify-center mb-4">
                            <Heart className="w-12 h-12 text-purple-500" />
                        </div>
                        <h1 className="text-3xl font-bold text-gray-800 mb-2">{getStepTitle()}</h1>
                        <p className="text-gray-600">{getStepSubtitle()}</p>
                    </div>

                    <div className="space-y-4">
                        {['boy', 'girl', 'other'].map((gender) => (
                            <button
                                key={gender}
                                onClick={() => setFormData({ ...formData, gender })}
                                className={`w-full py-4 px-6 rounded-2xl border-2 transition-all duration-200 text-center capitalize font-bold text-lg ${formData.gender === gender
                                        ? 'border-purple-500 bg-purple-50 text-purple-700'
                                        : 'border-gray-200 hover:border-gray-300 text-gray-600 hover:bg-gray-50'
                                    }`}
                            >
                                {gender}
                            </button>
                        ))}
                    </div>

                    <div className="flex gap-4 mt-8">
                        <button
                            onClick={prevStep}
                            className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 py-3 px-6 rounded-2xl font-medium transition-all duration-200 flex items-center justify-center gap-2"
                        >
                            <ArrowLeft className="w-4 h-4" />
                            Back
                        </button>
                        <button
                            onClick={nextStep}
                            disabled={!canProceed()}
                            className="flex-2 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white py-3 px-6 rounded-2xl font-bold transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                        >
                            Continue
                            <ArrowRight className="w-4 h-4" />
                        </button>
                    </div>

                    <div className="mt-8 text-center">
                        <div className="text-sm text-gray-500">Step 2 of 5</div>
                        <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                            <div className="bg-indigo-500 h-2 rounded-full transition-all duration-300" style={{ width: '40%' }}></div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    // Step 2: Interests
    if (currentStep === 2) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-indigo-100 via-purple-50 to-pink-100 flex items-center justify-center p-4">
                <div className="bg-white rounded-3xl shadow-2xl p-8 max-w-lg w-full">
                    <div className="text-center mb-8">
                        <div className="flex justify-center mb-4">
                            <Star className="w-12 h-12 text-pink-500" />
                        </div>
                        <h1 className="text-2xl lg:text-3xl font-bold text-gray-800 mb-2">{getStepTitle()}</h1>
                        <p className="text-gray-600">{getStepSubtitle()}</p>
                    </div>

                    <div className="grid grid-cols-2 gap-3 mb-8">
                        {interests.map((interest) => (
                            <button
                                key={interest}
                                onClick={() => handleInterestToggle(interest)}
                                className={`py-3 px-4 rounded-xl border-2 transition-all duration-200 text-center font-medium text-sm ${formData.interests.includes(interest)
                                        ? 'border-pink-500 bg-pink-50 text-pink-700'
                                        : 'border-gray-200 hover:border-gray-300 text-gray-600 hover:bg-gray-50'
                                    }`}
                            >
                                {interest}
                            </button>
                        ))}
                    </div>

                    <div className="flex gap-4">
                        <button
                            onClick={prevStep}
                            className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 py-3 px-6 rounded-2xl font-medium transition-all duration-200 flex items-center justify-center gap-2"
                        >
                            <ArrowLeft className="w-4 h-4" />
                            Back
                        </button>
                        <button
                            onClick={nextStep}
                            disabled={!canProceed()}
                            className="flex-2 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white py-3 px-6 rounded-2xl font-bold transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                        >
                            Continue
                            <ArrowRight className="w-4 h-4" />
                        </button>
                    </div>

                    <div className="mt-8 text-center">
                        <div className="text-sm text-gray-500">Step 3 of 5</div>
                        <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                            <div className="bg-indigo-500 h-2 rounded-full transition-all duration-300" style={{ width: '60%' }}></div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    // Step 3: Style
    if (currentStep === 3) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-indigo-100 via-purple-50 to-pink-100 flex items-center justify-center p-4">
                <div className="bg-white rounded-3xl shadow-2xl p-8 max-w-md w-full">
                    <div className="text-center mb-8">
                        <div className="flex justify-center mb-4">
                            <Book className="w-12 h-12 text-orange-500" />
                        </div>
                        <h1 className="text-2xl lg:text-3xl font-bold text-gray-800 mb-2">{getStepTitle()}</h1>
                        <p className="text-gray-600">{getStepSubtitle()}</p>
                    </div>

                    <div className="space-y-3 mb-8">
                        {styles.map((style) => (
                            <button
                                key={style.value}
                                onClick={() => setFormData({ ...formData, style: style.value })}
                                className={`w-full py-4 px-6 rounded-2xl border-2 transition-all duration-200 text-left font-medium flex items-center gap-4 ${formData.style === style.value
                                        ? 'border-orange-500 bg-orange-50 text-orange-700'
                                        : 'border-gray-200 hover:border-gray-300 text-gray-600 hover:bg-gray-50'
                                    }`}
                            >
                                <span className="text-3xl">{style.emoji}</span>
                                <div>
                                    <div className="font-bold">{style.label}</div>
                                    <div className="text-sm opacity-70">{style.desc}</div>
                                </div>
                            </button>
                        ))}
                    </div>

                    <div className="flex gap-4">
                        <button
                            onClick={prevStep}
                            className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 py-3 px-6 rounded-2xl font-medium transition-all duration-200 flex items-center justify-center gap-2"
                        >
                            <ArrowLeft className="w-4 h-4" />
                            Back
                        </button>
                        <button
                            onClick={nextStep}
                            disabled={!canProceed()}
                            className="flex-2 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white py-3 px-6 rounded-2xl font-bold transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                        >
                            Continue
                            <ArrowRight className="w-4 h-4" />
                        </button>
                    </div>

                    <div className="mt-8 text-center">
                        <div className="text-sm text-gray-500">Step 4 of 5</div>
                        <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                            <div className="bg-indigo-500 h-2 rounded-full transition-all duration-300" style={{ width: '80%' }}></div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    // Step 4: Lesson
    if (currentStep === 4) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-indigo-100 via-purple-50 to-pink-100 flex items-center justify-center p-4">
                <div className="bg-white rounded-3xl shadow-2xl p-8 max-w-md w-full">
                    <div className="text-center mb-8">
                        <div className="flex justify-center mb-4">
                            <Heart className="w-12 h-12 text-green-500" />
                        </div>
                        <h1 className="text-2xl lg:text-3xl font-bold text-gray-800 mb-2">{getStepTitle()}</h1>
                        <p className="text-gray-600">{getStepSubtitle()}</p>
                    </div>

                    <div className="space-y-6">
                        <textarea
                            value={formData.lesson}
                            onChange={(e) => setFormData({ ...formData, lesson: e.target.value })}
                            placeholder="Examples: Being kind to others, trying new things, sharing is caring, being brave when scared..."
                            className="w-full px-6 py-4 border-2 border-gray-200 rounded-2xl focus:border-green-500 focus:outline-none transition-colors resize-none h-32 text-lg"
                            autoFocus
                        />

                        <div className="flex gap-4">
                            <button
                                onClick={prevStep}
                                className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 py-3 px-6 rounded-2xl font-medium transition-all duration-200 flex items-center justify-center gap-2"
                            >
                                <ArrowLeft className="w-4 h-4" />
                                Back
                            </button>
                            <button
                                onClick={generateStory}
                                disabled={!canProceed()}
                                className="flex-2 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white py-3 px-6 rounded-2xl font-bold transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                            >
                                Create Story
                                <Sparkles className="w-4 h-4" />
                            </button>
                        </div>
                    </div>

                    <div className="mt-8 text-center">
                        <div className="text-sm text-gray-500">Step 5 of 5</div>
                        <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                            <div className="bg-indigo-500 h-2 rounded-full transition-all duration-300" style={{ width: '100%' }}></div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    // Step 5: Loading
    if (currentStep === 5) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-indigo-100 via-purple-50 to-pink-100 flex items-center justify-center p-4">
                <div className="bg-white rounded-3xl shadow-2xl p-12 text-center max-w-md w-full">
                    <div className="animate-pulse mb-6">
                        <Moon className="w-16 h-16 text-indigo-400 mx-auto" />
                    </div>
                    <h2 className="text-3xl font-bold text-gray-800 mb-4">{getStepTitle()}</h2>
                    <p className="text-gray-600 mb-6">{getStepSubtitle()}</p>
                    <div className="flex justify-center">
                        <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
                    </div>
                </div>
            </div>
        );
    }

    // Step 6: Story Display
    if (currentStep === 6) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-indigo-100 via-purple-50 to-pink-100 p-4">
                <div className="max-w-3xl mx-auto">
                    <div className="bg-white rounded-3xl shadow-2xl overflow-hidden">
                        <div className="bg-gradient-to-r from-indigo-500 to-purple-600 p-6">
                            <div className="text-center">
                                <h1 className="text-3xl font-bold text-white mb-2 flex items-center justify-center gap-3">
                                    <Book className="w-8 h-8" />
                                    {getStepTitle()}
                                </h1>
                                <p className="text-indigo-100">{getStepSubtitle()}</p>
                            </div>
                        </div>

                        <div className="p-8">
                            <div className="prose prose-lg max-w-none mb-8">
                                <div className="bg-gradient-to-r from-yellow-50 to-orange-50 rounded-2xl p-6 border-l-4 border-orange-300">
                                    <p className="text-gray-800 leading-relaxed whitespace-pre-wrap text-lg font-serif">
                                        {generatedStory}
                                    </p>
                                </div>
                            </div>

                            <div className="flex flex-col gap-4">
                                <div className="flex items-center justify-center gap-2 text-indigo-500 mb-4">
                                    <Star className="w-5 h-5" />
                                    <span className="text-sm font-medium">Sweet dreams!</span>
                                    <Star className="w-5 h-5" />
                                </div>

                                <button
                                    onClick={resetForm}
                                    className="w-full bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white py-4 px-6 rounded-2xl font-bold text-lg transition-all duration-200 transform hover:scale-[1.02] flex items-center justify-center gap-3"
                                >
                                    <Sparkles className="w-6 h-6" />
                                    Create Another Story
                                    <Heart className="w-6 h-6" />
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return null;
};

export default BedtimeStoryGenerator;