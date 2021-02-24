import json
from django.contrib.auth import authenticate, login, logout
from django.db import IntegrityError
from django.http import HttpResponse, HttpResponseRedirect, JsonResponse
from django.shortcuts import render
from django.urls import reverse
from django.contrib.auth.decorators import login_required

from .models import User, Post, Profile
from .forms import AddPostForm

def index(request):

    # Authenticate users can add post
    if request.user.is_authenticated:
        return render(request, 'network/index.html', {
            'add_post_form': AddPostForm()
        })
    return render(request, 'network/index.html')

@login_required
def add_post(request):

    # Add a post must be via POST
    if request.method != "POST":
        return JsonResponse({"error": "POST request required."}, status=400)

    # Get data from the form?
    data = json.loads(request.body)

    likes = []

    content = data.get("content", "")

    # Add data to API
    post = Post(
        content=content,
        original_poster=Profile.objects.get(user=request.user)
    )
    post.save()
    for like in likes:
        post.likes.add(like)
    post.save()

    return JsonResponse({"message": "Post sent successfully"}, status=201)

def post(request, post_id):
        
    # Query for requested post
    profile = Profile.objects.get(user=request.user)
    try:
        post = Post.objects.get(original_poster=profile, pk=post_id)
    except Post.DoesNotExist:
        return JsonResponse({"error": "Post not found."}, status=404)

    # GET Data in Json format (serialize method in models.py)
    if request.method == "GET":
        return JsonResponse(post.serialize())
    else:
        return JsonResponse({
            "error": "GET request required."
        }, status=400)

def nav_bar(request, nav_bar):

    # Filter posts returned based on nav_bar
    if nav_bar == "all_posts":
        posts = Post.objects.all()
        # Return posts in reverse chronologial order
        posts = posts.order_by("-timestamp")
        return JsonResponse([post.serialize() for post in posts], safe=False)
    elif nav_bar == "profiles":
        profiles = Profile.objects.all()
        return JsonResponse([profile.serialize() for profile in profiles], safe=False)
    else:
        return JsonResponse({"error": "Invalid Link."}, status=400)

def profile(request, user_profile):
    try:
        user = User.objects.get(username=user_profile)
        profile = Profile.objects.get(user=user)
    except User.DoesNotExist or Profile.DoesNotExist:
        return JsonResponse({"error": "Profile not found"}, status=404)

    if request.method == 'GET':
        return JsonResponse(profile.serialize())
    elif request.method == 'PUT':
        try:
            data = json.loads(request.body)
            print(data)
            following_user = data.get('following', '')
            following_user = " ".join(following_user)
            user_followed = User.objects.get(username=following_user)
            current_user = User.objects.get(username=request.user.username)
        except User.DoesNotExist:
            return JsonResponse({"error": f"User not found"}, status=404)
        
        follow_profile = Profile.objects.get(user=current_user)
        following_profile = Profile.objects.get(user=user_followed)
        following_profile.follower.add(current_user)
        follow_profile.following.add(user_followed)

        return JsonResponse({
            "message": "Profile has been added successfully"
        }, status=200)
    else:
        return JsonResponse({
            "error": "GET or PUT request required."
        }, status=400)

def login_view(request):
    if request.method == 'POST':

        # Attempt to sign user in
        username = request.POST['username']
        password = request.POST['password']
        user = authenticate(request, username=username, password=password)

        # Check if authentication successful
        if user is not None:
            login(request, user)
            return HttpResponseRedirect(reverse('index'))
        else:
            return render(request, 'network/login.html', {
                'message': 'Invalid username and/or password.'
            })
    else:
        return render(request, 'network/login.html')


def logout_view(request):
    logout(request)
    return HttpResponseRedirect(reverse('index'))


def register(request):
    if request.method == 'POST':
        username = request.POST['username']
        email = request.POST['email']

        # Ensure password matches confirmation
        password = request.POST['password']
        confirmation = request.POST['confirmation']
        if password != confirmation:
            return render(request, 'network/register.html', {
                'message': 'Passwords must match.'
            })

        # Attempt to create new user
        try:
            user = User.objects.create_user(username, email, password)
            user.save()
            profile = Profile.objects.create(user=user, location='', birth_date=None)
            profile.save()
        except IntegrityError:
            return render(request, 'network/register.html', {
                'message': 'Username already taken.'
            })
        login(request, user)
        return HttpResponseRedirect(reverse('index'))
    else:
        return render(request, 'network/register.html')
