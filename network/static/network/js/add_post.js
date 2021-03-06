document.addEventListener('DOMContentLoaded', () => {

    let nav_bar = 'all-posts'
    document.querySelector('#all-posts-link').addEventListener('click', () => load_posts(nav_bar));

    if (document.querySelector('#profile-link') !== null) {
        const user = document.querySelector('#profile-link').innerText;
        document.querySelector('#profile-link').addEventListener('click', () => load_profile(user))
    }

    if (document.querySelector('#following_posts_link') !== null) {
        nav_bar = 'following_posts'
        document.querySelector('#following_posts_link').addEventListener('click', () => load_posts(nav_bar));
    }

    if (document.querySelector('#add-post-form') !== null) {
        document.querySelector('#add-post-form').onsubmit = send_post
    }

    if (document.querySelector('#all-posts') !== null) {
        load_posts('all_posts')
    }
});

const follower_user = (current_user, user) => {
    const csrftoken = getCookie('csrftoken');
    fetch(`/profile/${current_user}`, {
        method: 'PUT',
        body: JSON.stringify({
            following: [user]
        }),
        headers: { "X-CSRFToken": csrftoken }
    })

    setTimeout(() => {
        load_profile(user)
    }, 500);
    return false
}

const load_profile = (user) => {

    document.querySelector('#profile-page').style.display = 'block';
    document.querySelector('#all-posts').style.display = 'block';
    document.querySelector('#add-post-form').style.display = 'none';

    document.querySelector('#all-posts').innerHTML = '';
    document.querySelector('#profile-page').innerHTML = '';

    fetch(`/profile/${user}`)
        .then(response => response.json())
        .then(data => {
            console.log(data);
            display_profile(data)
        })

    fetch(`/all_posts`)
        .then(response => response.json())
        .then(data => {
            console.log(data);
            data.forEach(post => {
                if (post.original_poster === user) {
                    display_posts(post)
                }
            })
        })
}

const display_profile = (data) => {

    const profileCard = document.createElement('div');
    profileCard.className = 'profile-card';

    document.getElementById('profile-page').appendChild(profileCard);
    current_user = document.getElementById('profile-link').innerText;

    if (data.user !== current_user) {
        const followButton = document.createElement('button');
        followButton.className = 'btn-follow';
        if (data.follower.includes(current_user)) {
            followButton.innerHTML = 'Unfollow';
        }
        else {
            followButton.innerHTML = 'Follow';
        }
        followButton.onclick = () => follower_user(current_user, data.user);
        document.getElementById('profile-page').appendChild(followButton);
    }

    const profileName = document.createElement('h1');
    profileName.className = 'profile-name';
    profileName.innerHTML = data.user;

    const profileFollowers = document.createElement('p');
    profileFollowers.className = 'profile-followers';
    profileFollowers.innerHTML = `${data.follower.length} follower(s)`;

    const profileFollowing = document.createElement('p');
    profileFollowing.className = 'profile-following';
    profileFollowing.innerHTML = `${data.following.length} following`;

    [profileName, profileFollowers, profileFollowing]
        .forEach(element => profileCard.appendChild(element));
}

const load_posts = (nav_bar) => {

    document.querySelector('#profile-page').style.display = 'none';

    document.querySelector('#all-posts').innerHTML = '';

    if (nav_bar === 'all_posts' || 'following_posts') {
        if (nav_bar === 'following_posts') {
            document.querySelector('#add-post-form').style.display = 'none';
        }
        fetch(`/${nav_bar}`)
            .then(response => response.json())
            .then(data => {
                console.log(data);
                if (data.length === 0) {
                    return document.querySelector('#all-posts').innerHTML = 'No posts.'
                }
                data.forEach(post => {
                    display_posts(post);
                })
            });
    }
}

const display_posts = (post) => {

    const postCard = document.createElement('div');
    postCard.className = 'post-card';

    document.getElementById('all-posts').appendChild(postCard);

    const postUser = document.createElement('a');
    postUser.className = 'post-user';

    if (document.querySelector('#profile-link')) {
        postUser.addEventListener('click', () => load_profile(post.original_poster))
    }
    postUser.innerHTML = post.original_poster;

    const postDate = document.createElement('div');
    postDate.className = 'post-date';
    postDate.innerHTML = post.timestamp;

    const postContent = document.createElement('div');
    postContent.className = 'post-content';
    postContent.innerHTML = post.content;

    const postLikes = document.createElement('div');
    postLikes.className = 'post-likes';
    postLikes.innerHTML = post.likes;

    [postUser, postDate, postContent, postLikes]
        .forEach(element => postCard.appendChild(element));

    postCard.appendChild(postLikes);
}

const clear_form = () => {

    document.querySelector('#add-content').value = '';
}

const send_post = () => {

    const csrftoken = getCookie('csrftoken');
    fetch('/add_post', {
        method: 'POST',
        body: JSON.stringify({
            content: document.querySelector('#add-content').value
        }),
        headers: { "X-CSRFToken": csrftoken }
    }).then(response => response.json()).then(result => console.log(result)); // Print result
    setTimeout(() => load_posts('all_posts'), 1000);
    clear_form()
    return false;
}

// Set up CSRF_token from Django DOCS
function getCookie(name) {

    let cookieValue = null;
    if (document.cookie && document.cookie !== '') {
        const cookies = document.cookie.split(';');
        for (let i = 0; i < cookies.length; i++) {
            const cookie = cookies[i].trim();
            // Does this cookie string begin with the name we want?
            if (cookie.substring(0, name.length + 1) === (name + '=')) {
                cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
                break;
            }
        }
    }
    return cookieValue;
}
